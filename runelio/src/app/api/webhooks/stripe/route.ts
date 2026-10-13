import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { env } from "@/lib/env";
import { processStripeEvent, type StripeEvent } from "@/server/billing";
import { HttpError } from "@/server/errors";
import { stripeGateway } from "@/server/stripe";

/**
 * Réception des webhooks Stripe.
 * - signature vérifiée sur le corps brut avec STRIPE_WEBHOOK_SECRET (en-tête `Stripe-Signature`) ;
 * - horodatage contrôlé par la bibliothèque (rejeu au-delà de 5 minutes refusé) ;
 * - traitement idempotent (identifiant d'événement) ; en cas d'erreur, réponse 500 pour que Stripe réessaie.
 */
export async function POST(req: Request) {
  const secret = env().STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const raw = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "invalid_signature" }, { status: 401 });

  let event: StripeEvent;
  try {
    // La vérification n'utilise que le secret du webhook : aucune clé d'API n'est nécessaire ici.
    event = Stripe.webhooks.constructEvent(raw, signature, secret) as unknown as StripeEvent;
  } catch (e) {
    if (e instanceof Stripe.errors.StripeSignatureVerificationError) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  try {
    const result = await processStripeEvent(getDb(), stripeGateway, event, { invoicesEnabled: env().INVOICES_ENABLED });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    if (e instanceof HttpError && e.status === 400) return NextResponse.json({ error: e.code }, { status: 400 });
    console.error("[stripe-webhook]", e);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
