import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { subscription } from "@/db/schema";
import { sendRenewalReminders } from "@/server/renewal";
import { createTestDb, createUser, resetDb } from "./helpers";

let db: Db;
const DAY = 86_400_000;
const NOW = new Date("2030-06-01T01:00:00Z");
const inDays = (d: number) => new Date(NOW.getTime() + d * DAY);
const mails: { to: string; subject: string; text: string }[] = [];
const send = async (m: { to: string; subject: string; text: string }) => {
  mails.push(m);
};

async function sub(userId: string, end: Date, extra: Partial<typeof subscription.$inferInsert> = {}) {
  await createUser(db, userId);
  await db.insert(subscription).values({ userId, whopMembershipId: `mem_${userId}`, status: "active", currentPeriodEnd: end, ...extra });
}

beforeAll(async () => {
  db = await createTestDb();
});
beforeEach(async () => {
  await resetDb(db);
  mails.length = 0;
});

describe("rappel avant renouvellement", () => {
  it("prévient une seule fois par échéance, dans les 7 jours qui précèdent", async () => {
    await sub("soon", inDays(6));
    await sub("later", inDays(20));
    let r = await sendRenewalReminders(db, send, "https://runelio.fr", NOW);
    expect(r.sent).toBe(1);
    expect(mails[0].to).toBe("soon@example.test");
    expect(mails[0].text).toContain("19,99 €");
    expect(mails[0].text).toContain("https://runelio.fr/resiliation");

    r = await sendRenewalReminders(db, send, "https://runelio.fr", inDays(1));
    expect(r.sent).toBe(0);

    // Après le renouvellement, la nouvelle échéance déclenche un nouveau rappel.
    await db.update(subscription).set({ currentPeriodEnd: inDays(36) }).where(eq(subscription.userId, "soon"));
    r = await sendRenewalReminders(db, send, "https://runelio.fr", inDays(30));
    expect(r.sent).toBe(1);
  });

  it("n'écrit pas aux abonnements résiliés, en échec de paiement ou terminés", async () => {
    await sub("canceling", inDays(3), { cancelAtPeriodEnd: true });
    await sub("pastdue", inDays(3), { status: "past_due" });
    await sub("expired", inDays(3), { status: "expired" });
    const r = await sendRenewalReminders(db, send, "https://runelio.fr", NOW);
    expect(r.sent).toBe(0);
  });

  it("réessaie au passage suivant si l'envoi échoue", async () => {
    await sub("fail", inDays(5));
    const failing = async () => {
      throw new Error("smtp down");
    };
    expect((await sendRenewalReminders(db, failing, "https://runelio.fr", NOW)).sent).toBe(0);
    expect((await sendRenewalReminders(db, send, "https://runelio.fr", NOW)).sent).toBe(1);
  });
});
