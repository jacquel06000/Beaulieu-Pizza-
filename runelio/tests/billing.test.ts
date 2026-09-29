import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { invoice, payment, subscription, webhookEvent } from "@/db/schema";
import {
  cancelSubscription,
  getCurrentSubscription,
  processWhopEvent,
  startCheckout,
  undoCancellation,
} from "@/server/billing";
import { HttpError } from "@/server/errors";
import { adjustPlan, generatePlanForUser, getActivePlan, saveProfile, setSessionCompleted } from "@/server/plans";
import { baseProfile, createTestDb, createUser, FakeWhop, resetDb } from "./helpers";

let db: Db;
let whop: FakeWhop;
const USER = "user_alice";
const OTHER = "user_bob";
const opts = { invoicesEnabled: true };
let seq = 0;
const evt = (type: string, data: Record<string, unknown>, timestamp = new Date().toISOString()) => ({ id: `msg_${++seq}`, type, timestamp, data });

async function activate(userId = USER, memId = "mem_1") {
  whop.setMembership({ id: memId, status: "active", metadata: { runelio_user_id: userId } });
  return processWhopEvent(db, whop, evt("membership.activated", { id: memId }), opts);
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
  whop = new FakeWhop();
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
    const r = await startCheckout(db, whop, { id: USER, emailVerified: true }, { acceptTerms: true, immediateExecution: true, appUrl: "https://runelio.fr" });
    expect(r).toMatchObject({ alreadySubscribed: false, purchaseUrl: expect.stringContaining("whop.com") });
    await expectHttp(generatePlanForUser(db, USER), 402);
  });

  it("un paiement en attente ou échoué ne donne aucun accès", async () => {
    whop.setMembership({ id: "mem_1", status: "drafted", metadata: { runelio_user_id: USER } });
    await processWhopEvent(db, whop, evt("payment.pending", { id: "pay_1", membership_id: "mem_1", metadata: { runelio_user_id: USER } }), opts);
    await expectHttp(generatePlanForUser(db, USER), 402);
    await processWhopEvent(db, whop, evt("payment.failed", { id: "pay_1", membership_id: "mem_1", failure_message: "Carte refusée" }), opts);
    const [p] = await db.select().from(payment).where(eq(payment.id, "pay_1"));
    expect(p.status).toBe("failed");
    expect(p.failureMessage).toBe("Carte refusée");
    await expectHttp(generatePlanForUser(db, USER), 402);
  });

  it("exige l'acceptation des conditions et une adresse vérifiée", async () => {
    await expectHttp(startCheckout(db, whop, { id: USER, emailVerified: false }, { acceptTerms: true, immediateExecution: true, appUrl: "x" }), 403);
    await expectHttp(startCheckout(db, whop, { id: USER, emailVerified: true }, { acceptTerms: false, immediateExecution: true, appUrl: "x" }), 400);
  });
});

describe("activation après paiement confirmé (webhook)", () => {
  it("active l'abonnement en relisant l'état auprès de Whop puis autorise la génération", async () => {
    expect(await activate()).toBe("processed");
    expect(whop.calls).toContain("get:mem_1");
    expect((await getCurrentSubscription(db, USER))?.status).toBe("active");
    const planId = await generatePlanForUser(db, USER);
    const data = await getActivePlan(db, USER);
    expect(data?.plan.id).toBe(planId);
    expect(data!.sessions.length).toBeGreaterThan(10);
  });

  it("payment.succeeded : paiement enregistré, facture unique, accès synchronisé", async () => {
    whop.setMembership({ id: "mem_1", status: "active", metadata: { runelio_user_id: USER } });
    const data = { id: "pay_ok", membership_id: "mem_1", metadata: { runelio_user_id: USER }, total: { amount: "19.99", currency: "eur" }, paid_at: "2026-10-01T10:00:00Z" };
    const e = evt("payment.succeeded", data);
    expect(await processWhopEvent(db, whop, e, opts)).toBe("processed");
    // Rejeu du même webhook : ignoré.
    expect(await processWhopEvent(db, whop, e, opts)).toBe("duplicate");
    // Même paiement livré sous un autre identifiant : pas de seconde facture.
    await processWhopEvent(db, whop, evt("payment.succeeded", data), opts);
    const invoices = await db.select().from(invoice);
    expect(invoices).toHaveLength(1);
    expect(invoices[0]).toMatchObject({ number: "RUN-2026-00001", amountCents: 1999, vatMention: "TVA non applicable, art. 293 B du CGI" });
    // Un événement « pending » arrivé en retard ne rétrograde pas le paiement.
    await processWhopEvent(db, whop, evt("payment.pending", { id: "pay_ok", membership_id: "mem_1" }, "2026-09-01T00:00:00Z"), opts);
    expect((await db.select().from(payment).where(eq(payment.id, "pay_ok")))[0].status).toBe("succeeded");
    expect(canGenerate(await getCurrentSubscription(db, USER))).toBe(true);
  });

  it("numérote les factures sans trou", async () => {
    await activate();
    for (const n of [1, 2, 3]) {
      await processWhopEvent(db, whop, evt("payment.succeeded", { id: `pay_${n}`, membership_id: "mem_1", total: { amount: "19.99", currency: "eur" }, paid_at: "2026-10-0" + n + "T10:00:00Z" }), opts);
    }
    expect((await db.select().from(invoice)).map((i) => i.number).sort()).toEqual(["RUN-2026-00001", "RUN-2026-00002", "RUN-2026-00003"]);
  });

  it("ignore un événement dont l'utilisateur est inconnu (métadonnées invalides)", async () => {
    whop.setMembership({ id: "mem_x", status: "active", metadata: { runelio_user_id: "inexistant" } });
    expect(await processWhopEvent(db, whop, evt("membership.activated", { id: "mem_x" }), opts)).toBe("ignored");
    expect(await db.select().from(subscription)).toHaveLength(0);
  });

  it("un échec de traitement est rejoué par Whop puis réussit", async () => {
    const e = evt("membership.activated", { id: "mem_absent" });
    await expect(processWhopEvent(db, whop, e, opts)).rejects.toThrow();
    expect((await db.select().from(webhookEvent).where(eq(webhookEvent.id, e.id)))[0].status).toBe("failed");
    whop.setMembership({ id: "mem_absent", status: "active", metadata: { runelio_user_id: USER } });
    expect(await processWhopEvent(db, whop, e, opts)).toBe("processed");
  });

  it("un abonnement ne donne accès qu'aux données de son titulaire", async () => {
    await activate(USER);
    await generatePlanForUser(db, USER);
    const data = await getActivePlan(db, USER);
    await activate(OTHER, "mem_2");
    await saveProfile(db, OTHER, baseProfile);
    await expectHttp(setSessionCompleted(db, OTHER, data!.sessions[0].id, true), 404);
    await setSessionCompleted(db, USER, data!.sessions[0].id, true);
    expect((await getActivePlan(db, OTHER))).toBeNull();
  });
});

function canGenerate(sub: Awaited<ReturnType<typeof getCurrentSubscription>>) {
  return Boolean(sub && ["active", "trialing", "canceling"].includes(sub.status));
}

describe("résiliation et expiration", () => {
  it("résiliation programmée : accès conservé jusqu'à la fin de période, puis coupé", async () => {
    await activate();
    const r = await cancelSubscription(db, whop, USER);
    expect(r.alreadyCanceled).toBe(false);
    expect(whop.calls).toContain("cancel:mem_1:true");
    const sub = await getCurrentSubscription(db, USER);
    expect(sub?.cancelAtPeriodEnd).toBe(true);
    await generatePlanForUser(db, USER); // encore dans la période payée
    const afterEnd = new Date(sub!.currentPeriodEnd!.getTime() + 1000);
    await expectHttp(generatePlanForUser(db, USER, afterEnd), 402);
    await expectHttp(getActivePlan(db, USER, afterEnd), 402);
  });

  it("l'utilisateur peut annuler sa résiliation avant l'échéance", async () => {
    await activate();
    await cancelSubscription(db, whop, USER);
    await undoCancellation(db, whop, USER);
    expect(whop.calls).toContain("patch:mem_1:false");
    expect((await getCurrentSubscription(db, USER))?.cancelAtPeriodEnd).toBe(false);
  });

  it("membership.deactivated (résiliée ou expirée) coupe l'accès au programme", async () => {
    await activate();
    await generatePlanForUser(db, USER);
    whop.setMembership({ id: "mem_1", status: "expired" });
    await processWhopEvent(db, whop, evt("membership.deactivated", { id: "mem_1" }), opts);
    await expectHttp(getActivePlan(db, USER), 402);
    await expectHttp(generatePlanForUser(db, USER), 402);
  });

  it("impayé (past_due) : programme consultable mais pas de nouvelle génération", async () => {
    await activate();
    await generatePlanForUser(db, USER);
    whop.setMembership({ id: "mem_1", status: "past_due" });
    await processWhopEvent(db, whop, evt("payment.failed", { id: "pay_r", membership_id: "mem_1", billing_reason: "subscription_cycle" }), opts);
    expect(await getActivePlan(db, USER)).not.toBeNull();
    await expectHttp(generatePlanForUser(db, USER), 402);
  });

  it("réabonnement après expiration : nouvel accès", async () => {
    await activate();
    whop.setMembership({ id: "mem_1", status: "canceled" });
    await processWhopEvent(db, whop, evt("membership.deactivated", { id: "mem_1" }), opts);
    await expectHttp(generatePlanForUser(db, USER), 402);
    await activate(USER, "mem_new");
    await generatePlanForUser(db, USER);
  });
});

describe("réajustement", () => {
  it("remplace les séances futures et conserve la date de course", async () => {
    await activate();
    await generatePlanForUser(db, USER, new Date("2026-10-01T08:00:00Z"));
    const before = await getActivePlan(db, USER);
    await adjustPlan(db, USER, { availableDays: [0, 2, 4, 6], restDays: [], timeSlots: {}, longRunDay: 6, maxSessionMinutes: 60 }, new Date("2026-10-20T08:00:00Z"));
    const after = await getActivePlan(db, USER);
    expect(after!.plan.raceDate).toBe(before!.plan.raceDate);
    const future = after!.sessions.filter((s) => s.date > "2026-10-20" && s.type !== "race");
    expect(future.every((s) => [0, 2, 4, 6].includes((new Date(s.date + "T00:00:00Z").getUTCDay() + 6) % 7))).toBe(true);
    expect(future.every((s) => s.durationMin <= 60)).toBe(true);
    // Les séances passées sont conservées.
    expect(after!.sessions.filter((s) => s.date <= "2026-10-20")).toHaveLength(before!.sessions.filter((s) => s.date <= "2026-10-20").length);
    expect(after!.plan.warnings.some((w) => w.code === "adjusted")).toBe(true);
  });
});
