import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { env, stripeConfigured } from "@/lib/env";
import { assertSameOrigin, handle } from "@/server/api";
import { openBillingPortal } from "@/server/billing";
import { HttpError } from "@/server/errors";
import { requireApiUser } from "@/server/session";
import { stripeGateway } from "@/server/stripe";

/** Ouvre le portail client Stripe (moyen de paiement, factures). */
export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireApiUser();
  if (!stripeConfigured()) throw new HttpError(503, "billing_not_configured", "Le paiement n'est pas encore configuré.");
  const { url } = await openBillingPortal(getDb(), stripeGateway, u.id, `${env().NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/espace/facturation`);
  return NextResponse.json({ url });
});
