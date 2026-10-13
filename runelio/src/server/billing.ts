/**
 * Abonnement : création du paiement, synchronisation Stripe, webhooks, résiliation.
 *
 * Principes :
 * - aucun accès n'est accordé sur la base d'une redirection navigateur : seul un
 *   webhook signé (vérifié en amont) déclenche une synchronisation, et l'état de
 *   l'abonnement est relu auprès de l'API Stripe (source de vérité) ;
 * - chaque webhook est journalisé par son identifiant : un doublon est ignoré ;
 * - les traitements sont eux-mêmes idempotents (upserts, contraintes d'unicité).
 */
import { randomUUID } from "node:crypto";
import { and, desc, eq, gt, isNotNull, sql } from "drizzle-orm";
import type { Db } from "@/db";
import {
  checkoutAttempt,
  invoice,
  payment,
  runnerProfile,
  subscription,
  user,
  webhookEvent,
} from "@/db/schema";
import { PRICING, PUBLISHER, TEXT_VERSIONS } from "@/lib/config";
import { canGeneratePlan, canViewPlan } from "./access";
import { badRequest, forbidden, HttpError } from "./errors";
import { enforceRateLimit } from "./rate-limit";
import type { GatewaySubscription, PaymentGateway } from "./stripe";

export type SubscriptionRow = typeof subscription.$inferSelect;

export async function getCurrentSubscription(db: Db, userId: string): Promise<SubscriptionRow | null> {
  const rows = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .orderBy(desc(subscription.updatedAt));
  return rows.find((r) => canViewPlan(r)) ?? rows[0] ?? null;
}

async function userExists(db: Db, id: unknown): Promise<string | null> {
  if (typeof id !== "string" || !id) return null;
  const rows = await db.select({ id: user.id }).from(user).where(eq(user.id, id)).limit(1);
  return rows[0]?.id ?? null;
}

async function resolveUserId(db: Db, metadataUserId: unknown, subscriptionId: string | null | undefined): Promise<string | null> {
  const fromMeta = await userExists(db, metadataUserId);
  if (fromMeta) return fromMeta;
  if (subscriptionId) {
    const rows = await db
      .select({ userId: subscription.userId })
      .from(subscription)
      .where(eq(subscription.stripeSubscriptionId, subscriptionId))
      .limit(1);
    if (rows[0]) return rows[0].userId;
  }
  return null;
}

const ENDED = new Set(["canceled", "incomplete_expired"]);

export async function upsertSubscription(db: Db, s: GatewaySubscription, userId: string, eventAt: Date): Promise<void> {
  const values = {
    userId,
    stripeSubscriptionId: s.id,
    stripeCustomerId: s.customerId || null,
    stripePriceId: s.priceId,
    status: s.status,
    cancelAtPeriodEnd: s.cancelAtPeriodEnd,
    currentPeriodEnd: s.currentPeriodEnd,
    lastEventAt: eventAt,
    canceledAt: ENDED.has(s.status) ? eventAt : null,
  };
  await db
    .insert(subscription)
    .values(values)
    .onConflictDoUpdate({
      target: subscription.stripeSubscriptionId,
      // L'utilisateur rattaché n'est jamais modifié par un événement ultérieur.
      set: {
        stripeCustomerId: values.stripeCustomerId,
        stripePriceId: values.stripePriceId,
        status: values.status,
        cancelAtPeriodEnd: values.cancelAtPeriodEnd,
        currentPeriodEnd: values.currentPeriodEnd,
        lastEventAt: sql`GREATEST(${subscription.lastEventAt}, ${eventAt.toISOString()}::timestamptz)`,
        canceledAt: values.canceledAt,
        updatedAt: new Date(),
      },
    });
}

export async function syncSubscription(db: Db, gateway: PaymentGateway, subscriptionId: string, eventAt: Date, hintUserId?: string | null) {
  const s = await gateway.getSubscription(subscriptionId);
  const userId = (await userExists(db, hintUserId)) ?? (await resolveUserId(db, s.userId, s.id));
  if (!userId) return { synced: false as const, reason: "user_not_found" };
  await upsertSubscription(db, s, userId, eventAt);
  return { synced: true as const, userId, subscription: s };
}

/* ------------------------------------------------------------------ */
/* Webhooks                                                            */
/* ------------------------------------------------------------------ */

/** Événement Stripe, réduit aux champs utilisés (signature vérifiée en amont). */
export type StripeEvent = {
  id: string;
  type: string;
  /** Horodatage Stripe, en secondes. */
  created?: number;
  data: { object: Record<string, unknown> };
};

export type ProcessOptions = { invoicesEnabled: boolean };
export type ProcessResult = "processed" | "duplicate" | "ignored";

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);
const INVOICE_EVENTS: Record<string, string> = {
  "invoice.paid": "succeeded",
  "invoice.payment_failed": "failed",
  "invoice.payment_action_required": "requires_action",
};

const str = (v: unknown): string | null => (typeof v === "string" && v ? v : v && typeof v === "object" && "id" in v && typeof v.id === "string" ? v.id : null);
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === "object" ? (v as Record<string, unknown>) : null);

export async function processStripeEvent(
  db: Db,
  gateway: PaymentGateway,
  event: StripeEvent,
  opts: ProcessOptions,
): Promise<ProcessResult> {
  if (!event?.id || !event.type || !obj(event.data?.object)) throw badRequest("Événement invalide.");

  const inserted = await db
    .insert(webhookEvent)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing()
    .returning({ id: webhookEvent.id });
  if (inserted.length === 0) {
    const [existing] = await db.select().from(webhookEvent).where(eq(webhookEvent.id, event.id));
    if (existing && (existing.status === "processed" || existing.status === "ignored")) return "duplicate";
  }

  const eventAt = event.created ? new Date(event.created * 1000) : new Date();
  const o = event.data.object;
  try {
    let result: ProcessResult = "ignored";
    if (SUBSCRIPTION_EVENTS.has(event.type)) {
      const id = str(o.id);
      if (!id) throw badRequest("Abonnement sans identifiant.");
      result = (await syncSubscription(db, gateway, id, eventAt)).synced ? "processed" : "ignored";
    } else if (event.type === "checkout.session.completed") {
      result = await handleCheckoutCompleted(db, gateway, o, eventAt);
    } else if (event.type === "checkout.session.expired") {
      const id = str(o.id);
      if (id) await db.update(checkoutAttempt).set({ status: "expired" }).where(eq(checkoutAttempt.stripeCheckoutSessionId, id));
      result = "processed";
    } else if (event.type in INVOICE_EVENTS) {
      result = await handleInvoiceEvent(db, gateway, o, INVOICE_EVENTS[event.type], eventAt, opts);
    }
    await db
      .update(webhookEvent)
      .set({ status: result, processedAt: new Date(), error: null })
      .where(eq(webhookEvent.id, event.id));
    return result;
  } catch (err) {
    await db
      .update(webhookEvent)
      .set({ status: "failed", error: err instanceof Error ? err.message.slice(0, 500) : "erreur" })
      .where(eq(webhookEvent.id, event.id));
    throw err;
  }
}

async function handleCheckoutCompleted(db: Db, gateway: PaymentGateway, o: Record<string, unknown>, eventAt: Date): Promise<ProcessResult> {
  const sessionId = str(o.id);
  const subscriptionId = str(o.subscription);
  if (!subscriptionId) return "ignored"; // session hors abonnement : rien à faire
  const hint = str(o.client_reference_id) ?? str(obj(o.metadata)?.runelio_user_id);
  const r = await syncSubscription(db, gateway, subscriptionId, eventAt, hint);
  if (!r.synced) return "ignored";
  if (sessionId) {
    await db
      .update(checkoutAttempt)
      .set({ status: "completed" })
      .where(and(eq(checkoutAttempt.stripeCheckoutSessionId, sessionId), eq(checkoutAttempt.userId, r.userId)));
  }
  return "processed";
}

/** Une facture Stripe = un prélèvement (souscription ou renouvellement). */
async function handleInvoiceEvent(
  db: Db,
  gateway: PaymentGateway,
  o: Record<string, unknown>,
  status: string,
  eventAt: Date,
  opts: ProcessOptions,
): Promise<ProcessResult> {
  const invoiceId = str(o.id);
  if (!invoiceId) throw badRequest("Facture sans identifiant.");
  const details = obj(obj(o.parent)?.subscription_details);
  const subscriptionId = str(details?.subscription);
  if (!subscriptionId) return "ignored"; // facture hors abonnement Runelio
  const userId = await resolveUserId(db, obj(details?.metadata)?.runelio_user_id, subscriptionId);
  if (!userId) return "ignored";

  const amountCents = typeof o.amount_paid === "number" && status === "succeeded" ? o.amount_paid : typeof o.amount_due === "number" ? o.amount_due : null;
  const currency = str(o.currency);
  const paidAtSec = obj(o.status_transitions)?.paid_at;
  const paidAt = typeof paidAtSec === "number" ? new Date(paidAtSec * 1000) : null;
  const failureMessage = status === "failed" ? "Le prélèvement a été refusé par le moyen de paiement." : null;

  const [existing] = await db.select().from(payment).where(eq(payment.id, invoiceId));
  const isNewer = !existing?.lastEventAt || existing.lastEventAt.getTime() <= eventAt.getTime();
  // Un paiement réussi ne redevient jamais « en échec » à cause d'un événement arrivé en retard.
  const keepSucceeded = existing?.status === "succeeded" && status !== "succeeded";
  if (!existing) {
    await db
      .insert(payment)
      .values({
        id: invoiceId,
        userId,
        stripeSubscriptionId: subscriptionId,
        status,
        amountCents,
        currency,
        billingReason: str(o.billing_reason),
        failureMessage,
        paidAt,
        lastEventAt: eventAt,
      })
      .onConflictDoNothing();
  } else if (isNewer && !keepSucceeded) {
    await db
      .update(payment)
      .set({
        status,
        amountCents: amountCents ?? existing.amountCents,
        currency: currency ?? existing.currency,
        failureMessage: failureMessage ?? (status === "succeeded" ? null : existing.failureMessage),
        paidAt: paidAt ?? existing.paidAt,
        lastEventAt: eventAt,
      })
      .where(eq(payment.id, invoiceId));
  }

  // L'état d'accès est toujours relu auprès de Stripe.
  await syncSubscription(db, gateway, subscriptionId, eventAt, userId);

  if (status === "succeeded") {
    await db
      .update(checkoutAttempt)
      .set({ status: "completed" })
      .where(and(eq(checkoutAttempt.userId, userId), eq(checkoutAttempt.status, "created")));
    if (opts.invoicesEnabled && amountCents !== null) {
      await createInvoice(db, invoiceId, userId, amountCents, (currency ?? "eur").toUpperCase(), paidAt ?? eventAt);
    }
  }
  return "processed";
}

function parisYear(d: Date): number {
  return Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric" }).format(d));
}

/** Crée la facture d'un paiement réussi, une seule fois, avec numérotation continue par année. */
export async function createInvoice(db: Db, paymentId: string, userId: string, amountCents: number, currency: string, issuedAt: Date) {
  await db.transaction(async (tx) => {
    // Verrou transactionnel : sérialise l'attribution des numéros.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(727274)`);
    const [already] = await tx.select({ id: invoice.id }).from(invoice).where(eq(invoice.paymentId, paymentId));
    if (already) return;
    const [u] = await tx.select({ email: user.email, name: user.name }).from(user).where(eq(user.id, userId));
    if (!u) return;
    const year = parisYear(issuedAt);
    const [{ max }] = await tx
      .select({ max: sql<number>`COALESCE(MAX(${invoice.sequence}), 0)` })
      .from(invoice)
      .where(eq(invoice.year, year));
    const sequence = Number(max) + 1;
    await tx.insert(invoice).values({
      number: `RUN-${year}-${String(sequence).padStart(5, "0")}`,
      year,
      sequence,
      paymentId,
      userId,
      customerEmail: u.email,
      customerName: u.name,
      description: `Abonnement Runelio — ${PRICING.frequency}`,
      amountCents,
      currency,
      vatMention: PUBLISHER.vatMention,
      issuedAt,
    });
  });
}

/* ------------------------------------------------------------------ */
/* Paiement et résiliation initiés par l'utilisateur                   */
/* ------------------------------------------------------------------ */

export type CheckoutUser = { id: string; email: string; emailVerified: boolean };

/** Dernier identifiant client Stripe connu du compte (réutilisé pour un réabonnement). */
async function knownCustomerId(db: Db, userId: string): Promise<string | null> {
  const [row] = await db
    .select({ customerId: subscription.stripeCustomerId })
    .from(subscription)
    .where(and(eq(subscription.userId, userId), isNotNull(subscription.stripeCustomerId)))
    .orderBy(desc(subscription.updatedAt))
    .limit(1);
  return row?.customerId ?? null;
}

export async function startCheckout(
  db: Db,
  gateway: PaymentGateway,
  u: CheckoutUser,
  input: { acceptTerms: boolean; immediateExecution: boolean; appUrl: string },
): Promise<{ alreadySubscribed: true } | { alreadySubscribed: false; checkoutUrl: string }> {
  if (!u.emailVerified) throw forbidden("Confirmez d'abord votre adresse e-mail.");
  const current = await getCurrentSubscription(db, u.id);
  if (canGeneratePlan(current)) return { alreadySubscribed: true };
  if (!input.acceptTerms) throw badRequest("Vous devez accepter les CGU/CGV pour continuer.");
  if (!input.immediateExecution) {
    throw badRequest("La demande d'exécution immédiate est nécessaire pour accéder au programme dès le paiement.");
  }
  const [profile] = await db.select({ userId: runnerProfile.userId }).from(runnerProfile).where(eq(runnerProfile.userId, u.id));
  if (!profile) throw badRequest("Complétez votre questionnaire avant de vous abonner.");

  await enforceRateLimit(db, `checkout:${u.id}`, 5, 600);

  // Une session ouverte depuis moins de 30 minutes est réutilisée (Stripe la garde valable 24 h).
  const recent = await db
    .select()
    .from(checkoutAttempt)
    .where(
      and(
        eq(checkoutAttempt.userId, u.id),
        eq(checkoutAttempt.status, "created"),
        gt(checkoutAttempt.createdAt, new Date(Date.now() - 30 * 60 * 1000)),
      ),
    )
    .orderBy(desc(checkoutAttempt.createdAt))
    .limit(1);
  if (recent[0]) {
    await db
      .update(checkoutAttempt)
      .set({ immediateExecutionConsentAt: new Date(), termsVersion: TEXT_VERSIONS.terms })
      .where(eq(checkoutAttempt.id, recent[0].id));
    return { alreadySubscribed: false, checkoutUrl: recent[0].checkoutUrl };
  }

  const base = input.appUrl.replace(/\/$/, "");
  const session = await gateway.createCheckout({
    userId: u.id,
    email: u.email,
    customerId: await knownCustomerId(db, u.id),
    successUrl: `${base}/abonnement/retour`,
    cancelUrl: `${base}/espace/abonnement`,
    idempotencyKey: `checkout-${u.id}-${randomUUID()}`,
  });
  if (!session.url) throw new HttpError(502, "stripe_error", "Stripe n'a pas renvoyé de page de paiement.");
  await db.insert(checkoutAttempt).values({
    userId: u.id,
    stripeCheckoutSessionId: session.id,
    checkoutUrl: session.url,
    immediateExecutionConsentAt: new Date(),
    termsVersion: TEXT_VERSIONS.terms,
  });
  return { alreadySubscribed: false, checkoutUrl: session.url };
}

export async function cancelSubscription(db: Db, gateway: PaymentGateway, userId: string) {
  const current = await getCurrentSubscription(db, userId);
  if (!current || !canViewPlan(current)) throw badRequest("Aucun abonnement actif à résilier.");
  if (current.cancelAtPeriodEnd) {
    return { alreadyCanceled: true as const, currentPeriodEnd: current.currentPeriodEnd };
  }
  const s = await gateway.setCancelAtPeriodEnd(current.stripeSubscriptionId, true);
  await upsertSubscription(db, s, userId, new Date());
  return { alreadyCanceled: false as const, currentPeriodEnd: s.currentPeriodEnd ?? current.currentPeriodEnd };
}

export async function undoCancellation(db: Db, gateway: PaymentGateway, userId: string) {
  const current = await getCurrentSubscription(db, userId);
  if (!current || !current.cancelAtPeriodEnd || !canViewPlan(current)) {
    throw badRequest("Aucune résiliation programmée à annuler.");
  }
  const s = await gateway.setCancelAtPeriodEnd(current.stripeSubscriptionId, false);
  await upsertSubscription(db, s, userId, new Date());
}

/** Portail client Stripe : moyen de paiement, factures et reçus. */
export async function openBillingPortal(db: Db, gateway: PaymentGateway, userId: string, returnUrl: string) {
  const customerId = await knownCustomerId(db, userId);
  if (!customerId) throw badRequest("Aucun abonnement Stripe n'est associé à votre compte.");
  return gateway.createPortalSession(customerId, returnUrl);
}

/** Paiement en attente : une session de paiement ouverte récemment, sans abonnement actif. */
export async function hasPendingCheckout(db: Db, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: checkoutAttempt.id })
    .from(checkoutAttempt)
    .where(
      and(
        eq(checkoutAttempt.userId, userId),
        eq(checkoutAttempt.status, "created"),
        gt(checkoutAttempt.createdAt, new Date(Date.now() - 24 * 3600 * 1000)),
      ),
    )
    .limit(1);
  return rows.length > 0;
}
