import { NextResponse } from "next/server";
import { env, stripeConfigured } from "@/lib/env";
import { PRICING } from "@/lib/config";
import { handle } from "@/server/api";
import { requireApiAdmin } from "@/server/session";
import { stripeGateway } from "@/server/stripe";

/** Contrôle que le prix Stripe correspond au prix affiché sur le site. */
export const GET = handle(async () => {
  await requireApiAdmin();
  if (!stripeConfigured()) return NextResponse.json({ configured: false });
  const p = await stripeGateway.getPrice(env().STRIPE_PRICE_ID!);
  const key = env().STRIPE_SECRET_KEY!;
  const checks = [
    { label: "Prix actif", ok: p.active, value: p.active },
    { label: "Devise EUR", ok: p.currency.toLowerCase() === "eur", value: p.currency },
    { label: "Montant 19,99 €", ok: p.unitAmount === PRICING.monthlyPriceCents, value: p.unitAmount === null ? "—" : `${p.unitAmount / 100} €` },
    { label: "Abonnement récurrent", ok: p.type === "recurring", value: p.type },
    { label: "Chaque mois", ok: p.interval === "month" && p.intervalCount === 1, value: `${p.intervalCount ?? "?"} × ${p.interval ?? "?"}` },
    { label: "Pas d'essai gratuit non affiché", ok: !p.trialDays, value: p.trialDays ?? 0 },
    { label: "Pas de taxe ajoutée (TVA non applicable)", ok: p.taxBehavior !== "exclusive", value: p.taxBehavior ?? "non précisé" },
  ];
  return NextResponse.json({ configured: true, mode: key.startsWith("sk_live_") ? "production" : "test", checks });
});
