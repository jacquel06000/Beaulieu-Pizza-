import { NextResponse } from "next/server";
import { env, whopConfigured } from "@/lib/env";
import { PRICING } from "@/lib/config";
import { handle } from "@/server/api";
import { requireApiAdmin } from "@/server/session";
import { toCents, whopGateway } from "@/server/whop";

/** Contrôle que le plan Whop correspond au prix affiché sur le site. */
export const GET = handle(async () => {
  await requireApiAdmin();
  if (!whopConfigured()) return NextResponse.json({ configured: false });
  const plan = await whopGateway.getPlan(env().WHOP_PLAN_ID!);
  const checks = [
    { label: "Devise EUR", ok: plan.currency?.toLowerCase() === "eur", value: plan.currency },
    { label: "Abonnement récurrent", ok: plan.plan_type === "renewal", value: plan.plan_type },
    { label: "Période de 30 jours", ok: plan.billing_period === PRICING.billingPeriodDays, value: plan.billing_period },
    { label: "Premier paiement = 19,99 €", ok: toCents(plan.initial_price) === PRICING.monthlyPriceCents, value: plan.initial_price },
    { label: "Renouvellement = 19,99 €", ok: toCents(plan.renewal_price) === PRICING.monthlyPriceCents, value: plan.renewal_price },
    { label: "Pas d'essai gratuit non affiché", ok: !plan.trial_period_days, value: plan.trial_period_days },
    { label: "Pas de taxe ajoutée au prix (tax_type ≠ exclusive)", ok: plan.tax_type !== "exclusive", value: `${plan.tax_type} / collect_tax=${plan.collect_tax}` },
    { label: "Pas de tarification adaptative (conversion de devise)", ok: !plan.adaptive_pricing_enabled, value: plan.adaptive_pricing_enabled },
  ];
  return NextResponse.json({ configured: true, formattedPrice: plan.formatted_price, checks });
});
