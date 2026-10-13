import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { checkoutAttempt, invoice, payment, subscription, webhookEvent } from "@/db/schema";
import {
  cancelSubscription,
  getCurrentSubscription,
  openBillingPortal,
  processStripeEvent,
  startCheckout,
  undoCancellation,
} from "@/server/billing";
import { HttpError } from "@/server/errors";
import { adjustPlan, generatePlanForUser, getActivePlan, saveProfile, setSessionCompleted } from "@/server/plans";
import { baseProfile, createTestDb, createUser, FakeStripe, resetDb } from "./helpers";

let db: Db;
let stripe: FakeStripe;
const USER = "user_alice";
const OTHER = "user_bob";
const opts = { invoicesEnabled: true };
let seq = 0;
const sec = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);
const evt = (type: string, object: Record<string, unknown>, created = Math.floor(Date.now() / 1000)) => ({ id: `evt_${++seq}`, type, created, data: { object } });
const checkout = { appUrl: "https://runelio.fr", acceptTerms: true, immediateExecution: true };
const alice = { id: USER, email: "alice@example.test", emailVerified: true };

/** Facture Stripe d'un abonnement (format API 2025-03-31 et suivantes). */
const inv = (id: string, subId: string, extra: Record<string, unknown> = {}) => ({
  id,
  currency: "eur",
  amount_due: 1999,
  amount_paid: 1999,
  billing_reason: "subscription_cycle",
  status_transitions: { paid_at: sec("2026-10-01T10:00:00Z") },
  parent: { type: "subscription_details", subscription_details: { subscription: subId, metadata: { runelio_user_id: USER } } },
  ...extra,
});

async function activate(userId = USER, subId = "sub_1") {
  stripe.setSubscription({ id: subId, status: "active", userId });
  return processStripeEvent(db, stripe, evt("customer.subscription.created", { id: subId }), opts);
}

async function expectHttp(p: Promise<unknown>, status: number) {
  await expect(p).rejects.toBeInstanceOf(HttpError);
  await p.catch((e: HttpError) => expect(e.status).toBe(status));
}

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await resetDb(db);
  stripe = new FakeStripe();
  await createUser(db, USER);
  await createUser(db, OTHER);
  await saveProfile(db, USER, baseProfile);
});

describe("aucun programme sans abonnement confirmé", () => {
  it("l'inscription gratuite permet d'enregistrer le questionnaire mais pas de générer", async () => {
    await expectHttp(generatePlanForUser(db, USER), 402);
    await expectHttp(getActivePlan(db, USER), 402);
  });

  it("ouvrir une session de paiement ne donne aucun accès", async () => {
    const r = await startCheckout(db, stripe, alice, checkout);
    expect(r).toMatchObject({ alreadySubscribed: false, checkoutUrl: expect.stringContaining("checkout.stripe.com") });
    await expectHttp(generatePlanForUser(db, USER), 402);
    // Une seconde demande rapprochée réutilise la même session.
    const again = await startCheckout(db, stripe, alice, checkout);
    expect(again).toEqual(r);
    expect(stripe.calls.filter((c) => c.startsWith("checkout:"))).toHaveLength(1);
  });

  it("un premier paiement incomplet ou échoué ne donne aucun accès", async () => {
    stripe.setSubscription({ id: "sub_1", status: "incomplete", userId: USER });
    await processStripeEvent(db, stripe, evt("invoice.payment_action_required", inv("in_1", "sub_1", { amount_paid: 0 })), opts);
    await expectHttp(generatePlanForUser(db, USER), 402);
    await processStripeEvent(db, stripe, evt("invoice.payment_failed", inv("in_1", "sub_1", { amount_paid: 0 })), opts);
    const [p] = await db.select().from(payment).where(eq(payment.id, "in_1"));
    expect(p.status).toBe("failed");
    expect(p.failureMessage).toContain("refusé");
    await expectHttp(generatePlanForUser(db, USER), 402);
    stripe.setSubscription({ id: "sub_1", status: "incomplete_expired" });
    await processStripeEvent(db, stripe, evt("customer.subscription.updated", { id: "sub_1" }), opts);
    await expectHttp(generatePlanForUser(db, USER), 402);
  });

  it("exige l'acceptation des conditions et une adresse vérifiée", async () => {
    await expectHttp(startCheckout(db, stripe, { ...alice, emailVerified: false }, checkout), 403);
    await expectHttp(startCheckout(db, stripe, alice, { ...checkout, acceptTerms: false }), 400);
    await expectHttp(startCheckout(db, stripe, alice, { ...checkout, immediateExecution: false }), 400);
  });
});

describe("activation après paiement confirmé (webhook)", () => {
  it("checkout.session.completed : relit l'abonnement chez Stripe puis autorise la génération", async () => {
    const r = await startCheckout(db, stripe, alice, checkout);
    if (r.alreadySubscribed) throw new Error("inattendu");
    const [attempt] = await db.select().from(checkoutAttempt);
    stripe.setSubscription({ id: "sub_1", status: "active", userId: USER });
    const res = await processStripeEvent(
      db,
      stripe,
      evt("checkout.session.completed", { id: attempt.stripeCheckoutSessionId, subscription: "sub_1", client_reference_id: USER, metadata: { runelio_user_id: USER } }),
      opts,
    );
    expect(res).toBe("processed");
    expect(stripe.calls).toContain("get:sub_1");
    expect((await db.select().from(checkoutAttempt))[0].status).toBe("completed");
    expect((await getCurrentSubscription(db, USER))?.status).toBe("active");
    const planId = await generatePlanForUser(db, USER);
    const data = await getActivePlan(db, USER);
    expect(data?.plan.id).toBe(planId);
    expect(data!.sessions.length).toBeGreaterThan(10);
  });

  it("invoice.paid : paiement enregistré, facture unique, accès synchronisé", async () => {
    stripe.setSubscription({ id: "sub_1", status: "active", userId: USER });
    const e = evt("invoice.paid", inv("in_ok", "sub_1", { billing_reason: "subscription_create" }));
    expect(await processStripeEvent(db, stripe, e, opts)).toBe("processed");
    // Rejeu du même événement : ignoré.
    expect(await processStripeEvent(db, stripe, e, opts)).toBe("duplicate");
    // Même facture livrée sous un autre événement : pas de seconde facture.
    await processStripeEvent(db, stripe, evt("invoice.paid", inv("in_ok", "sub_1")), opts);
    const invoices = await db.select().from(invoice);
    expect(invoices).toHaveLength(1);
    expect(invoices[0]).toMatchObject({ number: "RUN-2026-00001", amountCents: 1999, vatMention: "TVA non applicable, art. 293 B du CGI" });
    // Un échec arrivé en retard ne rétrograde pas un paiement réussi.
    await processStripeEvent(db, stripe, evt("invoice.payment_failed", inv("in_ok", "sub_1"), sec("2026-09-01T00:00:00Z")), opts);
    expect((await db.select().from(payment).where(eq(payment.id, "in_ok")))[0].status).toBe("succeeded");
    expect((await getCurrentSubscription(db, USER))?.status).toBe("active");
    await generatePlanForUser(db, USER);
  });

  it("numérote les factures sans trou", async () => {
    await activate();
    for (const n of [1, 2, 3]) {
      await processStripeEvent(db, stripe, evt("invoice.paid", inv(`in_${n}`, "sub_1", { status_transitions: { paid_at: sec(`2026-10-0${n}T10:00:00Z`) } })), opts);
    }
    expect((await db.select().from(invoice)).map((i) => i.number).sort()).toEqual(["RUN-2026-00001", "RUN-2026-00002", "RUN-2026-00003"]);
  });

  it("ignore un abonnement dont l'utilisateur est inconnu (métadonnées invalides)", async () => {
    stripe.setSubscription({ id: "sub_x", status: "active", userId: "inexistant" });
    expect(await processStripeEvent(db, stripe, evt("customer.subscription.created", { id: "sub_x" }), opts)).toBe("ignored");
    expect(await db.select().from(subscription)).toHaveLength(0);
  });

  it("ignore une facture sans abonnement (paiement hors Runelio)", async () => {
    expect(await processStripeEvent(db, stripe, evt("invoice.paid", { id: "in_manual", amount_paid: 500, parent: null }), opts)).toBe("ignored");
    expect(await db.select().from(payment)).toHaveLength(0);
  });

  it("un échec de traitement est rejoué par Stripe puis réussit", async () => {
    const e = evt("customer.subscription.created", { id: "sub_absent" });
    await expect(processStripeEvent(db, stripe, e, opts)).rejects.toThrow();
    expect((await db.select().from(webhookEvent).where(eq(webhookEvent.id, e.id)))[0].status).toBe("failed");
    stripe.setSubscription({ id: "sub_absent", status: "active", userId: USER });
    expect(await processStripeEvent(db, stripe, e, opts)).toBe("processed");
  });

  it("un abonnement ne donne accès qu'aux données de son titulaire", async () => {
    await activate(USER);
    await generatePlanForUser(db, USER);
    const data = await getActivePlan(db, USER);
    await activate(OTHER, "sub_2");
    await saveProfile(db, OTHER, baseProfile);
    await expectHttp(setSessionCompleted(db, OTHER, data!.sessions[0].id, true), 404);
    await setSessionCompleted(db, USER, data!.sessions[0].id, true);
    expect(await getActivePlan(db, OTHER)).toBeNull();
  });

  it("ne crée pas de second abonnement pour un abonné actif", async () => {
    await activate();
    expect(await startCheckout(db, stripe, alice, checkout)).toEqual({ alreadySubscribed: true });
    expect(stripe.calls.some((c) => c.startsWith("checkout:"))).toBe(false);
  });
});

describe("résiliation et expiration", () => {
  it("résiliation programmée : accès conservé jusqu'à la fin de période, puis coupé", async () => {
    await activate();
    const r = await cancelSubscription(db, stripe, USER);
    expect(r.alreadyCanceled).toBe(false);
    expect(stripe.calls).toContain("cancel_at_period_end:sub_1:true");
    const sub = await getCurrentSubscription(db, USER);
    expect(sub?.cancelAtPeriodEnd).toBe(true);
    expect((await cancelSubscription(db, stripe, USER)).alreadyCanceled).toBe(true);
    await generatePlanForUser(db, USER); // encore dans la période payée
    const afterEnd = new Date(sub!.currentPeriodEnd!.getTime() + 1000);
    await expectHttp(generatePlanForUser(db, USER, afterEnd), 402);
    await expectHttp(getActivePlan(db, USER, afterEnd), 402);
  });

  it("l'utilisateur peut annuler sa résiliation avant l'échéance", async () => {
    await activate();
    await cancelSubscription(db, stripe, USER);
    await undoCancellation(db, stripe, USER);
    expect(stripe.calls).toContain("cancel_at_period_end:sub_1:false");
    expect((await getCurrentSubscription(db, USER))?.cancelAtPeriodEnd).toBe(false);
  });

  it("customer.subscription.deleted coupe l'accès au programme", async () => {
    await activate();
    await generatePlanForUser(db, USER);
    stripe.setSubscription({ id: "sub_1", status: "canceled" });
    await processStripeEvent(db, stripe, evt("customer.subscription.deleted", { id: "sub_1" }), opts);
    await expectHttp(getActivePlan(db, USER), 402);
    await expectHttp(generatePlanForUser(db, USER), 402);
    expect((await getCurrentSubscription(db, USER))?.canceledAt).toBeTruthy();
  });

  it("impayé (past_due) : programme consultable mais pas de nouvelle génération ; unpaid : plus d'accès", async () => {
    await activate();
    await generatePlanForUser(db, USER);
    stripe.setSubscription({ id: "sub_1", status: "past_due" });
    await processStripeEvent(db, stripe, evt("invoice.payment_failed", inv("in_r", "sub_1", { amount_paid: 0 })), opts);
    expect(await getActivePlan(db, USER)).not.toBeNull();
    await expectHttp(generatePlanForUser(db, USER), 402);
    stripe.setSubscription({ id: "sub_1", status: "unpaid" });
    await processStripeEvent(db, stripe, evt("customer.subscription.updated", { id: "sub_1" }), opts);
    await expectHttp(getActivePlan(db, USER), 402);
  });

  it("réabonnement après expiration : nouvel accès, même client Stripe réutilisé", async () => {
    await activate();
    stripe.setSubscription({ id: "sub_1", status: "canceled" });
    await processStripeEvent(db, stripe, evt("customer.subscription.deleted", { id: "sub_1" }), opts);
    await expectHttp(generatePlanForUser(db, USER), 402);
    await startCheckout(db, stripe, alice, checkout);
    expect(stripe.calls).toContain("checkout:user_alice:cus_test");
    await activate(USER, "sub_new");
    await generatePlanForUser(db, USER);
  });

  it("portail client : réservé aux comptes ayant un client Stripe", async () => {
    await expectHttp(openBillingPortal(db, stripe, USER, "https://runelio.fr/espace/facturation"), 400);
    await activate();
    const { url } = await openBillingPortal(db, stripe, USER, "https://runelio.fr/espace/facturation");
    expect(url).toContain("billing.stripe.com");
  });
});

describe("réajustement", () => {
  it("remplace les séances futures et conserve la date de course", async () => {
    await activate();
    await generatePlanForUser(db, USER, new Date("2026-10-01T08:00:00Z"));
    const before = await getActivePlan(db, USER);
    const futureDone = before!.sessions.find((s) => s.date > "2026-10-25")!;
    await setSessionCompleted(db, USER, futureDone.id, true);
    await adjustPlan(db, USER, { availableDays: [0, 2, 4, 6], restDays: [], timeSlots: {}, longRunDay: 6, maxSessionMinutes: 60 }, new Date("2026-10-20T08:00:00Z"));
    const after = await getActivePlan(db, USER);
    expect(after!.plan.raceDate).toBe(before!.plan.raceDate);
    // Une séance future déjà réalisée est conservée, sans doublon ce jour-là.
    expect(after!.sessions.find((s) => s.id === futureDone.id)?.completedAt).toBeTruthy();
    expect(after!.sessions.filter((s) => s.date === futureDone.date)).toHaveLength(1);
    const future = after!.sessions.filter((s) => s.date > "2026-10-20" && s.type !== "race" && s.id !== futureDone.id);
    expect(future.every((s) => [0, 2, 4, 6].includes((new Date(s.date + "T00:00:00Z").getUTCDay() + 6) % 7))).toBe(true);
    expect(future.every((s) => s.durationMin <= 60)).toBe(true);
    // Les séances passées sont conservées.
    expect(after!.sessions.filter((s) => s.date <= "2026-10-20")).toHaveLength(before!.sessions.filter((s) => s.date <= "2026-10-20").length);
    expect(after!.plan.warnings.some((w) => w.code === "adjusted")).toBe(true);
  });
});
