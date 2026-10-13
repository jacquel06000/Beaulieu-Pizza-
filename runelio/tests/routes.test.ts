/**
 * Tests des routes API : signature des webhooks et contrôle d'accès côté serveur.
 */
import Stripe from "stripe";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/db";
import { baseProfile, createTestDb, createUser, FakeStripe, resetDb } from "./helpers";

const state = vi.hoisted(() => ({
  db: undefined as unknown as Db,
  stripe: undefined as unknown as FakeStripe,
  user: null as null | { id: string; email: string; name: string; emailVerified: boolean; role: string },
}));
const SECRET = "whsec_test_secret_value_1234567890";
const APP = "https://runelio.fr";

vi.mock("@/db", () => ({ getDb: () => state.db }));
vi.mock("@/lib/env", () => ({
  env: () => ({
    NODE_ENV: "test",
    NEXT_PUBLIC_APP_URL: APP,
    STRIPE_SECRET_KEY: "sk_test_x",
    STRIPE_WEBHOOK_SECRET: SECRET,
    STRIPE_PRICE_ID: "price_test",
    INVOICES_ENABLED: false,
    GIVEAWAYS_ENABLED: false,
  }),
  stripeConfigured: () => true,
}));
vi.mock("@/server/stripe", async (orig) => ({
  ...(await orig<typeof import("@/server/stripe")>()),
  get stripeGateway() {
    return state.stripe;
  },
}));
vi.mock("@/server/session", async () => {
  const { unauthorized, forbidden } = await import("@/server/errors");
  return {
    requireApiUser: async () => {
      if (!state.user) throw unauthorized();
      return state.user;
    },
    requireApiAdmin: async () => {
      if (!state.user) throw unauthorized();
      if (state.user.role !== "admin") throw forbidden();
      return state.user;
    },
  };
});

const { POST: webhook } = await import("@/app/api/webhooks/stripe/route");
const { POST: generate } = await import("@/app/api/plan/generate/route");
const { GET: getPlan } = await import("@/app/api/plan/route");
const { PATCH: patchSession } = await import("@/app/api/plan/sessions/[id]/route");
const { PUT: putProfile } = await import("@/app/api/profile/route");
const { GET: adminList } = await import("@/app/api/admin/giveaways/route");
const { POST: checkout } = await import("@/app/api/billing/checkout/route");
const { getActivePlan } = await import("@/server/plans");

/** Signe comme Stripe : en-tête `Stripe-Signature` (t=…, v1=HMAC-SHA256). */
function signed(body: object, timestamp = Math.floor(Date.now() / 1000)) {
  const payload = JSON.stringify(body);
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET, timestamp });
  return new Request(`${APP}/api/webhooks/stripe`, { method: "POST", body: payload, headers: { "stripe-signature": header } });
}

const json = (url: string, method: string, body?: unknown, origin = APP) =>
  new Request(`${APP}${url}`, { method, body: body ? JSON.stringify(body) : undefined, headers: { "content-type": "application/json", origin } });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const ALICE = { id: "user_alice", email: "a@example.test", name: "Alice", emailVerified: true, role: "user" };

beforeAll(async () => {
  state.db = await createTestDb();
});
beforeEach(async () => {
  await resetDb(state.db);
  state.stripe = new FakeStripe();
  state.user = null;
  await createUser(state.db, "user_alice");
  await createUser(state.db, "user_bob");
});

const event = (id: string, subId = "sub_1", type = "customer.subscription.created") => ({ id, type, created: Math.floor(Date.now() / 1000), data: { object: { id: subId } } });

describe("webhook Stripe", () => {
  it("rejette une signature invalide ou absente", async () => {
    const req = signed(event("evt_a"));
    const tampered = new Request(req.url, { method: "POST", body: JSON.stringify(event("evt_a", "sub_evil")), headers: req.headers });
    expect((await webhook(tampered)).status).toBe(401);
    expect((await webhook(new Request(`${APP}/api/webhooks/stripe`, { method: "POST", body: JSON.stringify(event("evt_b")) }))).status).toBe(401);
  });

  it("rejette un webhook rejoué hors de la fenêtre de temps (5 minutes)", async () => {
    const old = Math.floor(Date.now() / 1000) - 60 * 60;
    expect((await webhook(signed(event("evt_old"), old))).status).toBe(401);
  });

  it("accepte un webhook signé, active l'abonnement, et traite les doublons une seule fois", async () => {
    state.stripe.setSubscription({ id: "sub_1", status: "active", userId: "user_alice" });
    const res = await webhook(signed(event("evt_fixed")));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ result: "processed" });
    const again = await webhook(signed(event("evt_fixed")));
    expect(await again.json()).toMatchObject({ result: "duplicate" });
    expect(state.stripe.calls.filter((c) => c === "get:sub_1")).toHaveLength(1);
  });

  it("renvoie 500 si le traitement échoue, pour que Stripe réessaie", async () => {
    const res = await webhook(signed(event("evt_fail", "sub_unknown")));
    expect(res.status).toBe(500);
  });
});

describe("contrôle d'accès des API", () => {
  it("401 sans session", async () => {
    expect((await generate(json("/api/plan/generate", "POST"))).status).toBe(401);
    expect((await getPlan()).status).toBe(401);
  });

  it("403 si l'origine de la requête n'est pas le site", async () => {
    state.user = ALICE;
    expect((await generate(json("/api/plan/generate", "POST", undefined, "https://evil.example"))).status).toBe(403);
  });

  it("402 : compte gratuit, questionnaire enregistré mais génération refusée", async () => {
    state.user = ALICE;
    expect((await putProfile(json("/api/profile", "PUT", baseProfile))).status).toBe(200);
    const res = await generate(json("/api/plan/generate", "POST"));
    expect(res.status).toBe(402);
    expect(await res.json()).toMatchObject({ error: "subscription_required" });
    expect((await getPlan()).status).toBe(402);
  });

  it("validation stricte du questionnaire", async () => {
    state.user = ALICE;
    const res = await putProfile(json("/api/profile", "PUT", { ...baseProfile, availableDays: [1] }));
    expect(res.status).toBe(400);
  });

  it("parcours complet : paiement → webhook → génération → séance marquée", async () => {
    state.user = ALICE;
    await putProfile(json("/api/profile", "PUT", baseProfile));
    const co = await checkout(json("/api/billing/checkout", "POST", { acceptTerms: true, immediateExecution: true }));
    expect(await co.json()).toMatchObject({ checkoutUrl: expect.stringContaining("checkout.stripe.com") });
    expect((await generate(json("/api/plan/generate", "POST"))).status).toBe(402);

    state.stripe.setSubscription({ id: "sub_1", status: "active", userId: "user_alice" });
    await webhook(signed(event("evt_alice")));
    expect((await generate(json("/api/plan/generate", "POST"))).status).toBe(200);

    const plan = await getActivePlan(state.db, "user_alice");
    const sessionId = plan!.sessions[0].id;
    expect((await patchSession(json(`/api/plan/sessions/${sessionId}`, "PATCH", { completed: true }), ctx(sessionId))).status).toBe(200);

    // Bob ne peut pas modifier une séance d'Alice.
    state.user = { ...ALICE, id: "user_bob" };
    state.stripe.setSubscription({ id: "sub_2", status: "active", userId: "user_bob" });
    await webhook(signed(event("evt_bob", "sub_2")));
    expect((await patchSession(json(`/api/plan/sessions/${sessionId}`, "PATCH", { completed: false }), ctx(sessionId))).status).toBe(404);
  });

  it("les routes d'administration sont réservées aux administrateurs", async () => {
    state.user = ALICE;
    expect((await adminList()).status).toBe(403);
    state.user = { ...ALICE, role: "admin" };
    expect((await adminList()).status).toBe(200);
  });
});
