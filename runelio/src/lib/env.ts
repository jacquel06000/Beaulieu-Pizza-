import { z } from "zod";

const bool = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => v === "true" || v === "1");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET doit contenir au moins 32 caractères"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  WHOP_API_KEY: z.string().optional(),
  WHOP_WEBHOOK_SECRET: z.string().optional(),
  WHOP_PLAN_ID: z.string().optional(),
  WHOP_COMPANY_ID: z.string().optional(),
  WHOP_API_BASE_URL: z.string().url().default("https://api.whop.com/api/v1"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_SECURE: bool,
  MAIL_FROM: z.string().default("Runelio <no-reply@runelio.fr>"),
  CRON_SECRET: z.string().min(24).optional(),
  INVOICES_ENABLED: bool,
  GIVEAWAYS_ENABLED: bool,
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/** Lecture validée et paresseuse des variables d'environnement (jamais au build). */
export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `- ${i.path.join(".")}: ${i.message}`)
        .join("\n");
      throw new Error(`Configuration invalide :\n${issues}`);
    }
    cached = parsed.data;
  }
  return cached;
}

export function whopConfigured(): boolean {
  const e = env();
  return Boolean(e.WHOP_API_KEY && e.WHOP_WEBHOOK_SECRET && e.WHOP_PLAN_ID && e.WHOP_COMPANY_ID);
}

/**
 * Tirages « Cadeaux du mois » activés ? Lecture directe (sans valider toute la configuration),
 * utilisable dans les composants rendus à la construction (pied de page, pages légales).
 */
export function giveawaysEnabled(): boolean {
  const v = process.env.GIVEAWAYS_ENABLED;
  return v === "true" || v === "1";
}
