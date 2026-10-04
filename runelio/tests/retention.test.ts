import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { subscription, user, userPreference, webhookEvent } from "@/db/schema";
import { runRetention, touchLastSeen } from "@/server/retention";
import { createTestDb, createUser, resetDb } from "./helpers";

let db: Db;
const DAY = 86_400_000;
const NOW = new Date("2030-06-01T03:00:00Z");
const ago = (days: number) => new Date(NOW.getTime() - days * DAY);
const mails: string[] = [];
const send = async (m: { to: string }) => {
  mails.push(m.to);
};

async function seen(id: string, at: Date) {
  await db.insert(userPreference).values({ userId: id, lastSeenAt: at }).onConflictDoUpdate({ target: userPreference.userId, set: { lastSeenAt: at } });
}
const exists = async (id: string) => (await db.select().from(user).where(eq(user.id, id))).length === 1;

beforeAll(async () => {
  db = await createTestDb();
});
beforeEach(async () => {
  await resetDb(db);
  mails.length = 0;
});

describe("comptes inactifs (3 ans, avertissement 30 jours avant)", () => {
  it("avertit d'abord, puis supprime 30 jours plus tard", async () => {
    await createUser(db, "old");
    await seen("old", ago(3 * 365 + 10));
    let r = await runRetention(db, send, "https://runelio.fr", NOW);
    expect(r).toMatchObject({ warned: 1, deleted: 0 });
    expect(mails).toEqual(["old@example.test"]);
    expect(await exists("old")).toBe(true);

    // Le lendemain : pas de nouvel e-mail, pas encore de suppression.
    r = await runRetention(db, send, "https://runelio.fr", new Date(NOW.getTime() + DAY));
    expect(r).toMatchObject({ warned: 0, deleted: 0 });

    r = await runRetention(db, send, "https://runelio.fr", new Date(NOW.getTime() + 31 * DAY));
    expect(r.deleted).toBe(1);
    expect(await exists("old")).toBe(false);
  });

  it("ne touche ni aux comptes actifs, ni aux abonnés, ni aux administrateurs", async () => {
    await createUser(db, "recent");
    await seen("recent", ago(100));
    await createUser(db, "payer");
    await seen("payer", ago(4 * 365));
    await db.insert(subscription).values({ userId: "payer", whopMembershipId: "mem_p", status: "active", currentPeriodEnd: new Date(NOW.getTime() + 10 * DAY) });
    await createUser(db, "boss");
    await db.update(user).set({ role: "admin" }).where(eq(user.id, "boss"));
    await seen("boss", ago(4 * 365));
    const r = await runRetention(db, send, "https://runelio.fr", NOW);
    expect(r).toMatchObject({ warned: 0, deleted: 0 });
    expect(mails).toEqual([]);
  });

  it("une connexion après l'avertissement annule la suppression", async () => {
    await createUser(db, "back");
    await seen("back", ago(3 * 365));
    await runRetention(db, send, "https://runelio.fr", NOW);
    await touchLastSeen(db, "back", new Date(NOW.getTime() + 5 * DAY));
    const [pref] = await db.select().from(userPreference).where(eq(userPreference.userId, "back"));
    expect(pref.inactivityWarnedAt).toBeNull();
    const r = await runRetention(db, send, "https://runelio.fr", new Date(NOW.getTime() + 40 * DAY));
    expect(r.deleted).toBe(0);
    expect(await exists("back")).toBe(true);
  });
});

describe("journal technique des paiements (12 mois)", () => {
  it("supprime les entrées de plus de 12 mois", async () => {
    await db.insert(webhookEvent).values([
      { id: "old", type: "payment.succeeded", receivedAt: ago(400) },
      { id: "new", type: "payment.succeeded", receivedAt: ago(10) },
    ]);
    const r = await runRetention(db, send, "https://runelio.fr", NOW);
    expect(r.webhookEventsPurged).toBe(1);
    expect((await db.select().from(webhookEvent)).map((e) => e.id)).toEqual(["new"]);
  });
});
