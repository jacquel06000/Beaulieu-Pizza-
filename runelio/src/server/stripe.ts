/**
 * Passerelle Stripe (bibliothèque officielle `stripe`, version d'API épinglée).
 *
 * Fonctions utilisées — vérifiées dans les types du SDK `stripe` 23.0.0 (API 2026-09-30.endive) :
 *   checkout.sessions.create        → page de paiement hébergée par Stripe (mode « subscription »)
 *   subscriptions.retrieve          → état de l'abonnement (source de vérité)
 *   subscriptions.update            → résiliation en fin de période / annulation de la résiliation
 *   subscriptions.cancel            → résiliation immédiate (suppression du compte)
 *   billingPortal.sessions.create   → portail client (moyen de paiement, factures)
 *   prices.retrieve                 → contrôle du prix configuré
 * Depuis l'API 2025-03-31, la fin de période est portée par l'élément d'abonnement
 * (`items.data[].current_period_end`) et non plus par l'abonnement.
 * La vérification des webhooks utilise `stripe.webhooks.constructEvent`.
 *
 * Runelio ne manipule jamais de données de carte : la saisie se fait sur la page Stripe.
 */
import Stripe from "stripe";
import { env } from "@/lib/env";
import { PRICING, PUBLISHER } from "@/lib/config";

export const STRIPE_API_VERSION = "2026-09-30.endive" as const;

/** Abonnement Stripe ramené aux seuls champs utilisés par Runelio. */
export type GatewaySubscription = {
  id: string;
  customerId: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  priceId: string | null;
  /** Identifiant du compte Runelio (métadonnée posée à la création). */
  userId: string | null;
};

export type GatewayPrice = {
  id: string;
  active: boolean;
  currency: string;
  unitAmount: number | null;
  type: string;
  interval: string | null;
  intervalCount: number | null;
  trialDays: number | null;
  taxBehavior: string | null;
};

export interface PaymentGateway {
  createCheckout(input: {
    userId: string;
    email: string;
    customerId: string | null;
    successUrl: string;
    cancelUrl: string;
    idempotencyKey: string;
  }): Promise<{ id: string; url: string | null }>;
  getSubscription(id: string): Promise<GatewaySubscription>;
  /** `true` : résiliation en fin de période ; `false` : annule une résiliation programmée. */
  setCancelAtPeriodEnd(id: string, value: boolean): Promise<GatewaySubscription>;
  cancelNow(id: string): Promise<GatewaySubscription>;
  createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }>;
  getPrice(id: string): Promise<GatewayPrice>;
}

let client: Stripe | null = null;
export function stripeClient(): Stripe {
  const key = env().STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY manquant");
  client ??= new Stripe(key, { apiVersion: STRIPE_API_VERSION, timeout: 15_000, maxNetworkRetries: 2, appInfo: { name: "Runelio" } });
  return client;
}

const idOf = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : (v?.id ?? null));

export function toGatewaySubscription(s: Stripe.Subscription): GatewaySubscription {
  const item = s.items?.data?.[0];
  const periodEnd = item?.current_period_end ?? null;
  // Une résiliation programmée peut aussi être exprimée par une date (`cancel_at`, portail Stripe).
  const end = s.cancel_at ?? periodEnd;
  return {
    id: s.id,
    customerId: idOf(s.customer) ?? "",
    status: s.status,
    cancelAtPeriodEnd: Boolean(s.cancel_at_period_end || s.cancel_at),
    currentPeriodEnd: end ? new Date(end * 1000) : null,
    priceId: item?.price?.id ?? null,
    userId: typeof s.metadata?.runelio_user_id === "string" ? s.metadata.runelio_user_id : null,
  };
}

export const stripeGateway: PaymentGateway = {
  async createCheckout({ userId, email, customerId, successUrl, cancelUrl, idempotencyKey }) {
    const e = env();
    const session = await stripeClient().checkout.sessions.create(
      {
        mode: "subscription",
        line_items: [{ price: e.STRIPE_PRICE_ID!, quantity: 1 }],
        // Relie le paiement au compte : sur la session et sur l'abonnement créé.
        client_reference_id: userId,
        metadata: { runelio_user_id: userId },
        subscription_data: { metadata: { runelio_user_id: userId } },
        ...(customerId ? { customer: customerId } : { customer_email: email }),
        success_url: successUrl,
        cancel_url: cancelUrl,
        locale: "fr",
        // Franchise en base de TVA : aucune taxe n'est calculée ni ajoutée au prix.
        automatic_tax: { enabled: false },
        allow_promotion_codes: false,
        custom_text: {
          submit: {
            message: `Abonnement Runelio : ${PRICING.label} ${PRICING.frequency}, renouvelé automatiquement jusqu'à résiliation (résiliable à tout moment depuis votre espace). ${PUBLISHER.vatMention}.`,
          },
        },
      },
      { idempotencyKey },
    );
    return { id: session.id, url: session.url };
  },
  async getSubscription(id) {
    return toGatewaySubscription(await stripeClient().subscriptions.retrieve(id));
  },
  async setCancelAtPeriodEnd(id, value) {
    const stripe = stripeClient();
    if (value) return toGatewaySubscription(await stripe.subscriptions.update(id, { cancel_at_period_end: true }));
    const current = await stripe.subscriptions.retrieve(id);
    // Annule la résiliation, qu'elle ait été posée en « fin de période » ou à une date.
    const params: Stripe.SubscriptionUpdateParams = current.cancel_at && !current.cancel_at_period_end ? { cancel_at: "" } : { cancel_at_period_end: false };
    return toGatewaySubscription(await stripe.subscriptions.update(id, params));
  },
  async cancelNow(id) {
    return toGatewaySubscription(await stripeClient().subscriptions.cancel(id));
  },
  async createPortalSession(customerId, returnUrl) {
    const s = await stripeClient().billingPortal.sessions.create({ customer: customerId, return_url: returnUrl, locale: "fr" });
    return { url: s.url };
  },
  async getPrice(id) {
    const p = await stripeClient().prices.retrieve(id);
    return {
      id: p.id,
      active: p.active,
      currency: p.currency,
      unitAmount: p.unit_amount,
      type: p.type,
      interval: p.recurring?.interval ?? null,
      intervalCount: p.recurring?.interval_count ?? null,
      trialDays: p.recurring?.trial_period_days ?? null,
      taxBehavior: p.tax_behavior,
    };
  },
};
