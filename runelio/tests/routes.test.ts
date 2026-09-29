/**
 * Tests des routes API : signature des webhooks et contrôle d'accès côté serveur.
 */
import { Webhook } from "standardwebhooks";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Db } from "@/db";
import { baseProfile, createTestDb, createUser, FakeWhop, resetDb } from "./helpers";

const state = vi.hoisted(() => ({
  db: undefined as unknown as Db,
  whop: undefined as unknown as FakeWhop,
  user: null as null | { id: string; email: string; name: string; emailVerified: boolean; role: string },
}));
const SECRET = "ws_test_secret_value_1234567890";
const APP = "https://runelio.fr";

vi.mock("@/db", () => ({ getDb: () => state.db }));
vi.mock("@/lib/env", () => ({
  env: () => ({
    NODE_ENV: "test",
    NEXT_PUBLIC_APP_URL: APP,
    WHOP_WEBHOOK_SECRET: SECRET,
    WHOP_PLAN_ID: "plan_test",
    INVOICES_ENABLED: false,
    GIVEAWAYS_ENABLED: false,
  }),
  whopConfigured: () => true,
}));
vi.mock("@/server/whop", async (orig) => ({
  ...(await orig<typeof import("@/server/whop")>()),
  get whopGateway() {
    return state.whop;
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

const { POST: webhook } = await import("@/app/api/webhooks/whop/route");
const { POST: generate } = await import("@/app/api/plan/generate/route");
const { GET: getPlan } = await import("@/app/api/plan/route");
const { PATCH: patchSession } = await import("@/app/api/plan/sessions/[id]/route");
const { PUT: putProfile } = await import("@/app/api/profile/route");
const { GET: adminList } = await import("@/app/api/admin/giveaways/route");
const { POST: checkout } = await import("@/app/api/billing/checkout/route");
const { getActivePlan } = await import("@/server/plans");

/** Signe comme Whop : HMAC-SHA256 avec les octets littéraux du secret `ws_…`. */
function signed(body: object, id = `msg_${Math.random()}`) {
  const payload = JSON.stringify(body);
  const wh = new Webhook(Buffer.from(SECRET, "utf8").toString("base64"));
  const ts = new Date();
  const signature = wh.sign(id, ts, payload);
  return new Request(`${APP}/api/webhooks/whop`, {
    method: "POST",
    body: payload,
    headers: { "webhook-id": id, "webhook-timestamp": String(Math.floor(ts.getTime() / 1000)), "webhook-signature": signature },
  });
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
  state.whop = new FakeWhop();
  state.user = null;
  await createUser(state.db, "user_alice");
  await createUser(state.db, "user_bob");
});

const activation = { id: "evt_1", type: "membership.activated", timestamp: new Date().toISOString(), data: { id: "mem_1" } };

describe("webhook Whop", () => {
  it("rejette une signature invalide ou absente", async () => {
    const req = signed(activation);
    const tampered = new Request(req.url, { method: "POST", body: JSON.stringify({ ...activation, data: { id: "mem_evil" } }), headers: req.headers });
    expect((await webhook(tampered)).status).toBe(401);
    expect((await webhook(new Request(`${APP}/api/webhooks/whop`, { method: "POST", body: JSON.stringify(activation) }))).status).toBe(401);
  });

  it("rejette un webhook rejoué hors de la fenêtre de temps", async () => {
    const payload = JSON.stringify(activation);
    const old = new Date(Date.now() - 60 * 60 * 1000);
    const sig = new Webhook(Buffer.from(SECRET).toString("base64")).sign("msg_old", old, payload);
    const req = new Request(`${APP}/api/webhooks/whop`, {
      method: "POST",
      body: payload,
      headers: { "webhook-id": "msg_old", "webhook-timestamp": String(Math.floor(old.getTime() / 1000)), "webhook-signature": sig },
    });
    expect((await webhook(req)).status).toBe(401);
  });

  it("accepte un webhook signé, active l'abonnement, et traite les doublons une seule fois", async () => {
    state.whop.setMembership({ id: "mem_1", status: "active", metadata: { runelio_user_id: "user_alice" } });
    const res = await webhook(signed(activation, "msg_fixed"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ result: "processed" });
    const again = await webhook(signed(activation, "msg_fixed"));
    expect(await again.json()).toMatchObject({ result: "duplicate" });
    expect(state.whop.calls.filter((c) => c === "get:mem_1")).toHaveLength(1);
  });

  it("renvoie 500 si le traitement échoue, pour que Whop réessaie", async () => {
    const res = await webhook(signed({ ...activation, data: { id: "mem_unknown" } }));
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
    expect(await co.json()).toMatchObject({ purchaseUrl: expect.stringContaining("whop.com") });
    expect((await generate(json("/api/plan/generate", "POST"))).status).toBe(402);

    state.whop.setMembership({ id: "mem_1", status: "active", metadata: { runelio_user_id: "user_alice" } });
    await webhook(signed(activation));
    expect((await generate(json("/api/plan/generate", "POST"))).status).toBe(200);

    const plan = await getActivePlan(state.db, "user_alice");
    const sessionId = plan!.sessions[0].id;
    expect((await patchSession(json(`/api/plan/sessions/${sessionId}`, "PATCH", { completed: true }), ctx(sessionId))).status).toBe(200);

    // Bob ne peut pas modifier une séance d'Alice.
    state.user = { ...ALICE, id: "user_bob" };
    state.whop.setMembership({ id: "mem_2", status: "active", metadata: { runelio_user_id: "user_bob" } });
    await webhook(signed({ ...activation, data: { id: "mem_2" } }));
    expect((await patchSession(json(`/api/plan/sessions/${sessionId}`, "PATCH", { completed: false }), ctx(sessionId))).status).toBe(404);
  });

  it("les routes d'administration sont réservées aux administrateurs", async () => {
    state.user = ALICE;
    expect((await adminList()).status).toBe(403);
    state.user = { ...ALICE, role: "admin" };
    expect((await adminList()).status).toBe(200);
  });
});
