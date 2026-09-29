/**
 * Client minimal de l'API Whop v1 (https://api.whop.com/api/v1).
 *
 * Endpoints utilisés — vérifiés dans le SDK officiel `@whop/sdk` 2.0.0
 * (types générés depuis l'OpenAPI Whop, version d'API 2026-09-23) :
 *   POST /checkout_configurations        → URL de paiement hébergée (purchase_url)
 *   GET  /memberships/{id}               → état de l'abonnement (source de vérité)
 *   POST /memberships/{id}/cancel        → résiliation (fin de période ou immédiate)
 *   PATCH /memberships/{id}              → annulation d'une résiliation programmée
 *   GET  /plans/{id}                     → contrôle du prix configuré
 * La vérification des webhooks utilise `unwrapWebhook` (Standard Webhooks) du SDK.
 *
 * Runelio ne manipule jamais de données de carte : la saisie se fait sur la page Whop.
 */
import { env } from "@/lib/env";

export const WHOP_API_VERSION_DATE = "2026-09-23";

export class WhopApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "WhopApiError";
  }
}

export type WhopMembership = {
  id: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  plan_id: string;
  product_id: string;
  metadata: Record<string, unknown> | null;
  user_id: string | null;
  created_at: string;
};

export type WhopCheckoutConfiguration = {
  id: string;
  purchase_url?: string | null;
  plan?: { id: string } | null;
  metadata?: Record<string, unknown> | null;
};

export type WhopPlan = {
  id: string;
  currency: string;
  billing_period: number | null;
  initial_price: number;
  renewal_price: number;
  plan_type: string;
  trial_period_days: number | null;
  collect_tax: boolean;
  tax_type: string;
  adaptive_pricing_enabled: boolean;
  formatted_price: string;
};

export interface WhopGateway {
  createCheckout(input: {
    userId: string;
    redirectUrl: string;
  }): Promise<WhopCheckoutConfiguration>;
  getMembership(id: string): Promise<WhopMembership>;
  cancelMembership(id: string, atPeriodEnd: boolean, reason?: string): Promise<WhopMembership>;
  /** `false` annule une résiliation programmée (doc SDK : « reverses a pending cancellation »). */
  setCancelAtPeriodEnd(id: string, value: boolean): Promise<WhopMembership>;
  getPlan(id: string): Promise<WhopPlan>;
}

async function call<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const e = env();
  if (!e.WHOP_API_KEY) throw new WhopApiError("WHOP_API_KEY manquant", 500);
  const res = await fetch(`${e.WHOP_API_BASE_URL.replace(/\/$/, "")}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${e.WHOP_API_KEY}`,
      "Content-Type": "application/json",
      "Api-Version-Date": WHOP_API_VERSION_DATE,
      ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new WhopApiError(`Whop API ${res.status} sur ${path}`, res.status, body);
  }
  return body as T;
}

export const whopGateway: WhopGateway = {
  async createCheckout({ userId, redirectUrl }) {
    const e = env();
    return call<WhopCheckoutConfiguration>("checkout_configurations", {
      method: "POST",
      body: JSON.stringify({
        account_id: e.WHOP_COMPANY_ID,
        plan_id: e.WHOP_PLAN_ID,
        redirect_url: redirectUrl,
        // Copiées par Whop sur les paiements et memberships : permet de relier l'achat au compte.
        metadata: { runelio_user_id: userId },
      }),
    });
  },
  getMembership(id) {
    return call<WhopMembership>(`memberships/${encodeURIComponent(id)}`);
  },
  cancelMembership(id, atPeriodEnd, reason) {
    return call<WhopMembership>(`memberships/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
      body: JSON.stringify({ cancel_at_period_end: atPeriodEnd, reason }),
      idempotencyKey: `cancel-${id}-${atPeriodEnd ? "period" : "now"}`,
    });
  },
  setCancelAtPeriodEnd(id, value) {
    return call<WhopMembership>(`memberships/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ cancel_at_period_end: value }),
    });
  },
  getPlan(id) {
    return call<WhopPlan>(`plans/${encodeURIComponent(id)}`);
  },
};

/** Espace client Whop (documentation Whop) : gestion du moyen de paiement et des commandes. */
export const WHOP_CUSTOMER_MEMBERSHIPS_URL = "https://whop.com/@me/settings/memberships";

/** Convertit un montant Whop (unités majeures, nombre ou chaîne décimale) en centimes. */
export function toCents(amount: number | string | null | undefined): number | null {
  if (amount === null || amount === undefined) return null;
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}
