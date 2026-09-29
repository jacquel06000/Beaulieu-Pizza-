/**
 * Abonnement : création du paiement, synchronisation Whop, webhooks, résiliation.
 *
 * Principes :
 * - aucun accès n'est accordé sur la base d'une redirection navigateur : seul un
 *   webhook signé (vérifié en amont) déclenche une synchronisation, et l'état de
 *   la membership est relu auprès de l'API Whop (source de vérité) ;
 * - chaque webhook est journalisé par son identifiant : un doublon est ignoré ;
 * - les traitements sont eux-mêmes idempotents (upserts, contraintes d'unicité).
 */
import { and, desc, eq, gt, sql } from "drizzle-orm";
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
import { toCents, type WhopGateway, type WhopMembership } from "./whop";

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

async function resolveUserId(
  db: Db,
  metadata: Record<string, unknown> | null | undefined,
  membershipId: string | null | undefined,
): Promise<string | null> {
  const fromMeta = await userExists(db, metadata?.runelio_user_id);
  if (fromMeta) return fromMeta;
  if (membershipId) {
    const rows = await db
      .select({ userId: subscription.userId })
      .from(subscription)
      .where(eq(subscription.whopMembershipId, membershipId))
      .limit(1);
    if (rows[0]) return rows[0].userId;
  }
  return null;
}

export async function upsertMembership(db: Db, m: WhopMembership, userId: string, eventAt: Date): Promise<void> {
  const values = {
    userId,
    whopMembershipId: m.id,
    whopPlanId: m.plan_id,
    status: m.status,
    cancelAtPeriodEnd: Boolean(m.cancel_at_period_end),
    currentPeriodEnd: m.current_period_end ? new Date(m.current_period_end) : null,
    lastEventAt: eventAt,
    canceledAt: m.status === "canceled" || m.status === "expired" ? eventAt : null,
  };
  await db
    .insert(subscription)
    .values(values)
    .onConflictDoUpdate({
      target: subscription.whopMembershipId,
      // L'utilisateur rattaché n'est jamais modifié par un événement ultérieur.
      set: {
        whopPlanId: values.whopPlanId,
        status: values.status,
        cancelAtPeriodEnd: values.cancelAtPeriodEnd,
        currentPeriodEnd: values.currentPeriodEnd,
        lastEventAt: sql`GREATEST(${subscription.lastEventAt}, ${eventAt.toISOString()}::timestamptz)`,
        canceledAt: values.canceledAt,
        updatedAt: new Date(),
      },
    });
}

export async function syncMembership(db: Db, gateway: WhopGateway, membershipId: string, eventAt: Date, hintUserId?: string | null) {
  const m = await gateway.getMembership(membershipId);
  const userId = hintUserId ?? (await resolveUserId(db, m.metadata, m.id));
  if (!userId) return { synced: false as const, reason: "user_not_found" };
  await upsertMembership(db, m, userId, eventAt);
  return { synced: true as const, userId, membership: m };
}

/* ------------------------------------------------------------------ */
/* Webhooks                                                            */
/* ------------------------------------------------------------------ */

export type WhopEvent = {
  id: string;
  type: string;
  timestamp?: string;
  data: Record<string, unknown>;
};

export type ProcessOptions = { invoicesEnabled: boolean };
export type ProcessResult = "processed" | "duplicate" | "ignored";

function moneyToCents(v: unknown): number | null {
  if (v && typeof v === "object" && "amount" in v) return toCents((v as { amount: string }).amount);
  if (typeof v === "number" || typeof v === "string") return toCents(v);
  return null;
}

function moneyCurrency(v: unknown, fallback: unknown): string | null {
  if (v && typeof v === "object" && "currency" in v) return String((v as { currency: string }).currency);
  return typeof fallback === "string" ? fallback : null;
}

const PAYMENT_EVENTS: Record<string, string> = {
  "payment.created": "created",
  "payment.pending": "pending",
  "payment.requires_action": "requires_action",
  "payment.authorized": "authorized",
  "payment.succeeded": "succeeded",
  "payment.failed": "failed",
  "payment.canceled": "canceled",
};
const MEMBERSHIP_EVENTS = new Set([
  "membership.activated",
  "membership.deactivated",
  "membership.cancel_at_period_end_changed",
  "membership.trial_ending_soon",
]);

export async function processWhopEvent(
  db: Db,
  gateway: WhopGateway,
  event: WhopEvent,
  opts: ProcessOptions,
): Promise<ProcessResult> {
  if (!event?.id || !event.type) throw badRequest("Événement invalide.");

  const inserted = await db
    .insert(webhookEvent)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing()
    .returning({ id: webhookEvent.id });
  if (inserted.length === 0) {
    const [existing] = await db.select().from(webhookEvent).where(eq(webhookEvent.id, event.id));
    if (existing && (existing.status === "processed" || existing.status === "ignored")) return "duplicate";
  }

  const eventAt = event.timestamp ? new Date(event.timestamp) : new Date();
  try {
    let result: ProcessResult = "ignored";
    if (MEMBERSHIP_EVENTS.has(event.type)) {
      const membershipId = String(event.data.id ?? "");
      if (!membershipId) throw badRequest("Membership sans identifiant.");
      const r = await syncMembership(db, gateway, membershipId, eventAt);
      result = r.synced ? "processed" : "ignored";
    } else if (event.type in PAYMENT_EVENTS) {
      result = await handlePaymentEvent(db, gateway, event, PAYMENT_EVENTS[event.type], eventAt, opts);
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

async function handlePaymentEvent(
  db: Db,
  gateway: WhopGateway,
  event: WhopEvent,
  status: string,
  eventAt: Date,
  opts: ProcessOptions,
): Promise<ProcessResult> {
  const d = event.data;
  const paymentId = String(d.id ?? "");
  if (!paymentId) throw badRequest("Paiement sans identifiant.");
  const membershipId = typeof d.membership_id === "string" ? d.membership_id : null;
  const userId = await resolveUserId(db, d.metadata as Record<string, unknown> | null, membershipId);
  if (!userId) return "ignored";

  const amountCents = moneyToCents(d.total) ?? moneyToCents(d.subtotal);
  const currency = moneyCurrency(d.total, d.currency);
  const paidAt = typeof d.paid_at === "string" ? new Date(d.paid_at) : null;

  const [existing] = await db.select().from(payment).where(eq(payment.id, paymentId));
  const isNewer = !existing?.lastEventAt || existing.lastEventAt.getTime() <= eventAt.getTime();
  // Un paiement réussi ne redevient jamais « en attente » à cause d'un événement arrivé en retard.
  const keepSucceeded = existing?.status === "succeeded" && ["created", "pending", "requires_action", "authorized"].includes(status);
  if (!existing) {
    await db
      .insert(payment)
      .values({
        id: paymentId,
        userId,
        whopMembershipId: membershipId,
        status,
        amountCents,
        currency,
        billingReason: typeof d.billing_reason === "string" ? d.billing_reason : null,
        failureMessage: typeof d.failure_message === "string" ? d.failure_message : null,
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
        failureMessage: typeof d.failure_message === "string" ? d.failure_message : existing.failureMessage,
        paidAt: paidAt ?? existing.paidAt,
        whopMembershipId: membershipId ?? existing.whopMembershipId,
        lastEventAt: eventAt,
      })
      .where(eq(payment.id, paymentId));
  }

  if (membershipId) {
    // L'état d'accès est toujours relu auprès de Whop.
    await syncMembership(db, gateway, membershipId, eventAt, userId);
  }

  if (status === "succeeded") {
    await db
      .update(checkoutAttempt)
      .set({ status: "completed" })
      .where(and(eq(checkoutAttempt.userId, userId), eq(checkoutAttempt.status, "created")));
    if (opts.invoicesEnabled && amountCents !== null) {
      await createInvoice(db, paymentId, userId, amountCents, (currency ?? "eur").toUpperCase(), paidAt ?? eventAt);
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

export type CheckoutUser = { id: string; emailVerified: boolean };

export async function startCheckout(
  db: Db,
  gateway: WhopGateway,
  u: CheckoutUser,
  input: { acceptTerms: boolean; immediateExecution: boolean; appUrl: string },
): Promise<{ alreadySubscribed: true } | { alreadySubscribed: false; purchaseUrl: string }> {
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
    return { alreadySubscribed: false, purchaseUrl: recent[0].purchaseUrl };
  }

  const conf = await gateway.createCheckout({ userId: u.id, redirectUrl: `${input.appUrl.replace(/\/$/, "")}/abonnement/retour` });
  if (!conf.purchase_url) throw new HttpError(502, "whop_error", "Whop n'a pas renvoyé d'URL de paiement.");
  await db.insert(checkoutAttempt).values({
    userId: u.id,
    whopCheckoutConfigurationId: conf.id,
    purchaseUrl: conf.purchase_url,
    immediateExecutionConsentAt: new Date(),
    termsVersion: TEXT_VERSIONS.terms,
  });
  return { alreadySubscribed: false, purchaseUrl: conf.purchase_url };
}

export async function cancelSubscription(db: Db, gateway: WhopGateway, userId: string) {
  const current = await getCurrentSubscription(db, userId);
  if (!current || !canViewPlan(current)) throw badRequest("Aucun abonnement actif à résilier.");
  if (current.cancelAtPeriodEnd || current.status === "canceling") {
    return { alreadyCanceled: true as const, currentPeriodEnd: current.currentPeriodEnd };
  }
  const m = await gateway.cancelMembership(current.whopMembershipId, true, "Résiliation depuis l'espace client runelio.fr");
  await upsertMembership(db, m, userId, new Date());
  return {
    alreadyCanceled: false as const,
    currentPeriodEnd: m.current_period_end ? new Date(m.current_period_end) : current.currentPeriodEnd,
  };
}

export async function undoCancellation(db: Db, gateway: WhopGateway, userId: string) {
  const current = await getCurrentSubscription(db, userId);
  if (!current || !(current.cancelAtPeriodEnd || current.status === "canceling") || !canViewPlan(current)) {
    throw badRequest("Aucune résiliation programmée à annuler.");
  }
  const m = await gateway.setCancelAtPeriodEnd(current.whopMembershipId, false);
  await upsertMembership(db, m, userId, new Date());
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
