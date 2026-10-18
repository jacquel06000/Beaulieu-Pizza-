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
  /** Clé secrète Stripe (`sk_live_…` en production, `sk_test_…` en mode test). Uniquement dans le .env du serveur. */
  STRIPE_SECRET_KEY: z.string().optional(),
  /** Secret de signature du webhook (`whsec_…`). */
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  /** Prix récurrent 19,99 € / mois (`price_…`). */
  STRIPE_PRICE_ID: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_SECURE: bool,
  MAIL_FROM: z.string().default("Runelio <contact@runelio.fr>"),
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

export function stripeConfigured(): boolean {
  const e = env();
  return Boolean(e.STRIPE_SECRET_KEY && e.STRIPE_WEBHOOK_SECRET && e.STRIPE_PRICE_ID);
}

/**
 * Tirages « Cadeaux du mois » activés ? Lecture directe (sans valider toute la configuration),
 * utilisable dans les composants rendus à la construction (pied de page, pages légales).
 */
export function giveawaysEnabled(): boolean {
  const v = process.env.GIVEAWAYS_ENABLED;
  return v === "true" || v === "1";
}
