import { unwrapWebhook, WebhookVerificationError } from "@whop/sdk/helpers";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { env } from "@/lib/env";
import { processWhopEvent, type WhopEvent } from "@/server/billing";
import { HttpError } from "@/server/errors";
import { whopGateway } from "@/server/whop";

/**
 * Réception des webhooks Whop (Standard Webhooks).
 * - signature vérifiée sur le corps brut avec WHOP_WEBHOOK_SECRET ;
 * - horodatage contrôlé par la bibliothèque (rejeu hors fenêtre refusé) ;
 * - traitement idempotent ; en cas d'erreur, réponse 500 pour que Whop réessaie.
 */
export async function POST(req: Request) {
  const secret = env().WHOP_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const raw = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => (headers[k] = v));

  let event: WhopEvent;
  try {
    event = unwrapWebhook<WhopEvent>(raw, { headers, key: secret });
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  // L'identifiant de livraison Standard Webhooks sert de clé d'idempotence.
  const id = headers["webhook-id"] || event.id;
  try {
    const result = await processWhopEvent(getDb(), whopGateway, { ...event, id }, { invoicesEnabled: env().INVOICES_ENABLED });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    if (e instanceof HttpError && e.status === 400) return NextResponse.json({ error: e.code }, { status: 400 });
    console.error("[whop-webhook]", e);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
