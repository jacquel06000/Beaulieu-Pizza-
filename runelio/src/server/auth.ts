import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { phoneSchema } from "@/lib/validation";
import { getDb, schema } from "@/db";
import { env } from "@/lib/env";
import { layoutEmail, sendMail } from "./mailer";
import { onBeforeAccountDeletion } from "./account-deletion";

function createAuth() {
  const e = env();
  return betterAuth({
    appName: "Runelio",
    baseURL: e.NEXT_PUBLIC_APP_URL,
    secret: e.BETTER_AUTH_SECRET,
    trustedOrigins: [e.NEXT_PUBLIC_APP_URL],
    telemetry: { enabled: false },
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        rateLimit: schema.rateLimit,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      autoSignIn: false,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 60 * 30,
      sendResetPassword: async ({ user, url }) => {
        const mail = layoutEmail(
          "Réinitialiser votre mot de passe",
          "Vous avez demandé à réinitialiser votre mot de passe Runelio. Ce lien est valable 30 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
          { label: "Choisir un nouveau mot de passe", url },
        );
        await sendMail({ to: user.email, subject: "Runelio — réinitialisation du mot de passe", ...mail });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60 * 24,
      sendVerificationEmail: async ({ user, url }) => {
        const mail = layoutEmail(
          "Confirmez votre adresse e-mail",
          "Bienvenue sur Runelio ! Confirmez votre adresse pour activer votre compte. Ce lien est valable 24 heures.",
          { label: "Confirmer mon adresse", url },
        );
        await sendMail({ to: user.email, subject: "Runelio — confirmez votre adresse e-mail", ...mail });
      },
    },
    user: {
      additionalFields: {
        phone: { type: "string", required: false, input: true },
        adult: { type: "boolean", required: false, input: true, defaultValue: false },
        role: { type: "string", required: false, input: false, defaultValue: "user" },
      },
      deleteUser: {
        enabled: true,
        beforeDelete: async (user) => {
          await onBeforeAccountDeletion(user.id);
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          // Validation serveur des champs saisis à l'inscription (le client n'est pas fiable).
          before: async (data) => {
            const phone = typeof data.phone === "string" ? data.phone.trim() : "";
            if (phone && !phoneSchema.safeParse(phone).success) {
              throw new APIError("BAD_REQUEST", { message: "Numéro de téléphone invalide." });
            }
            // Service réservé aux personnes majeures (CGU) : la déclaration est obligatoire.
            if (data.adult !== true) {
              throw new APIError("BAD_REQUEST", { message: "Le service est réservé aux personnes de 18 ans ou plus." });
            }
            const name = String(data.name ?? "").trim().slice(0, 80);
            if (!name) throw new APIError("BAD_REQUEST", { message: "Indiquez un prénom ou un pseudo." });
            return { data: { ...data, name, phone: phone || null, role: "user", adult: true } };
          },
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 300, max: 5 },
        "/request-password-reset": { window: 300, max: 3 },
        "/forget-password": { window: 300, max: 3 },
        "/send-verification-email": { window: 300, max: 3 },
        "/delete-user": { window: 300, max: 5 },
      },
    },
    advanced: {
      useSecureCookies: e.NODE_ENV === "production",
      cookiePrefix: "runelio",
    },
    plugins: [nextCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
const g = globalThis as unknown as { __runelioAuth?: Auth };

export function getAuth(): Auth {
  if (!g.__runelioAuth) g.__runelioAuth = createAuth();
  return g.__runelioAuth;
}
