import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { subscription, trainingSession, userPreference } from "@/db/schema";
import { addDays, mondayOf } from "@/domain/dates";
import { getAdminStats } from "@/server/admin-stats";
import { buildIcs, calendarForToken, foldLine, getOrCreateCalendarToken } from "@/server/calendar";
import { HttpError } from "@/server/errors";
import { feelingScale, moveSession, setFeeling } from "@/server/plan-tools";
import { adjustPlan, generatePlanForUser, getActivePlan, saveProfile } from "@/server/plans";
import { parisHour, sendDueReminders, setReminderPreference } from "@/server/reminders";
import { baseProfile, createTestDb, createUser, resetDb } from "./helpers";

let db: Db;
const U = "user_run";
const OTHER = "user_other";
// Mercredi 7 octobre 2026, 10 h à Paris.
const NOW = new Date("2026-10-07T08:00:00Z");

async function expectHttp(p: Promise<unknown>, status: number) {
  await expect(p).rejects.toBeInstanceOf(HttpError);
  await p.catch((e: HttpError) => expect(e.status).toBe(status));
}

async function subscribe(userId: string, status = "active") {
  await db.insert(subscription).values({ userId, whopMembershipId: `mem_${userId}`, status, currentPeriodEnd: new Date("2026-12-31T00:00:00Z") });
}

async function planSessions(userId = U) {
  return (await getActivePlan(db, userId, NOW))!.sessions;
}

beforeAll(async () => {
  db = await createTestDb();
});
beforeEach(async () => {
  await resetDb(db);
  await createUser(db, U);
  await createUser(db, OTHER);
  await saveProfile(db, U, { ...baseProfile, availableDays: [1, 3, 6] });
  await subscribe(U);
  await generatePlanForUser(db, U, NOW);
});

describe("déplacer une séance", () => {
  it("déplace vers un jour libre de la même semaine et garde la date d'origine", async () => {
    const s = (await planSessions()).find((x) => x.type !== "race" && x.date > addDays("2026-10-07", 6))!;
    const occupied = new Set((await planSessions()).map((x) => x.date));
    const free = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(mondayOf(s.date), i)).find((d) => !occupied.has(d))!;
    expect(free).toBeTruthy();
    const r = await moveSession(db, U, s.id, free, NOW);
    expect(r.date).toBe(free);
    const moved = (await planSessions()).find((x) => x.id === s.id)!;
    expect(moved.date).toBe(free);
    expect(moved.originalDate).toBe(s.date);
  });

  it("refuse : autre semaine, jour occupé, passé, course, séance d'un autre compte", async () => {
    const sessions = await planSessions();
    const s = sessions.find((x) => x.type !== "race" && x.date > "2026-10-12")!;
    const other = sessions.find((x) => x.date !== s.date && mondayOf(x.date) === mondayOf(s.date))!;
    await expectHttp(moveSession(db, U, s.id, addDays(s.date, 7), NOW), 400);
    await expectHttp(moveSession(db, U, s.id, other.date, NOW), 400);
    await expectHttp(moveSession(db, U, s.id, "2026-10-01", NOW), 400);
    const race = sessions.find((x) => x.type === "race")!;
    await expectHttp(moveSession(db, U, race.id, addDays(race.date, -1), NOW), 400);
    await saveProfile(db, OTHER, baseProfile);
    await subscribe(OTHER);
    await expectHttp(moveSession(db, OTHER, s.id, addDays(s.date, 1), NOW), 404);
  });

  it("refusé sans abonnement actif (impayé = lecture seule)", async () => {
    await db.update(subscription).set({ status: "past_due" }).where(eq(subscription.userId, U));
    const s = (await planSessions()).find((x) => x.type !== "race" && x.date > "2026-10-12")!;
    await expectHttp(moveSession(db, U, s.id, addDays(s.date, 1), NOW), 402);
  });
});

describe("ressenti", () => {
  it("enregistre le ressenti et marque la séance réalisée", async () => {
    const s = (await planSessions())[0];
    await setFeeling(db, U, s.id, "hard", NOW);
    const [row] = await db.select().from(trainingSession).where(eq(trainingSession.id, s.id));
    expect(row.feeling).toBe("hard");
    expect(row.completedAt).not.toBeNull();
    await expectHttp(setFeeling(db, OTHER, s.id, "easy", NOW), 402);
  });

  it("allège la charge quand les séances sont jugées trop difficiles", () => {
    expect(feelingScale(["easy", "ok", null]).scale).toBe(1);
    expect(feelingScale(["too_hard", "too_hard", "ok"]).scale).toBe(0.9);
    expect(feelingScale(["hard", "hard", "ok"]).scale).toBe(0.9);
  });

  it("le réajustement tient compte des ressentis", async () => {
    const past = (await planSessions()).filter((x) => x.date <= "2026-10-20" && x.type !== "race");
    for (const s of past) await setFeeling(db, U, s.id, "too_hard", NOW);
    await adjustPlan(db, U, { availableDays: [1, 3, 6], restDays: [], timeSlots: {}, longRunDay: 6, maxSessionMinutes: 75 }, new Date("2026-10-20T08:00:00Z"));
    const plan = await getActivePlan(db, U, new Date("2026-10-20T08:00:00Z"));
    expect(plan!.plan.warnings.find((w) => w.code === "adjusted")?.message).toMatch(/difficiles/);
  });
});

describe("agenda (iCalendar)", () => {
  it("produit un fichier iCalendar valide", () => {
    const ics = buildIcs(
      [{ id: "s1", date: "2026-10-08", title: "Footing, facile; lent", durationMin: 40, distanceKm: 6, intensity: { rpe: "3/10", label: "Facile", talk: "Parler" }, instructions: "Ligne 1\nLigne 2", structure: ["A"] }],
      { calendarName: "Runelio", appUrl: "https://runelio.fr", now: NOW },
    );
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261008");
    expect(ics).toContain("DTEND;VALUE=DATE:20261009");
    expect(ics).toContain("SUMMARY:Footing\\, facile\\; lent");
    for (const line of ics.split("\r\n")) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
    expect(foldLine("é".repeat(60)).split("\r\n ").join("")).toBe("é".repeat(60));
  });

  it("lien privé : fonctionne avec le jeton, change quand on le renouvelle, vide sans abonnement", async () => {
    const token = await getOrCreateCalendarToken(db, U);
    expect(await getOrCreateCalendarToken(db, U)).toBe(token);
    const ics = await calendarForToken(db, token, "https://runelio.fr", NOW);
    expect(ics!.match(/BEGIN:VEVENT/g)!.length).toBe((await planSessions()).length);
    expect(await calendarForToken(db, "jeton-inconnu-123456789", "https://runelio.fr", NOW)).toBeNull();
    const rotated = await getOrCreateCalendarToken(db, U, true);
    expect(rotated).not.toBe(token);
    expect(await calendarForToken(db, token, "https://runelio.fr", NOW)).toBeNull();
    await db.update(subscription).set({ status: "expired" }).where(eq(subscription.userId, U));
    expect(await calendarForToken(db, rotated, "https://runelio.fr", NOW)).not.toContain("BEGIN:VEVENT");
  });
});

describe("rappels e-mail", () => {
  const sent: string[] = [];
  const send = async (m: { to: string; subject: string }) => {
    sent.push(`${m.to}|${m.subject}`);
  };

  it("n'envoie qu'aux abonnés ayant activé les rappels, à partir de 17 h, une seule fois", async () => {
    sent.length = 0;
    const s = (await planSessions()).find((x) => x.type !== "race")!;
    const eveningBefore = new Date(`${addDays(s.date, -1)}T16:30:00Z`); // 18 h 30 à Paris
    const morningBefore = new Date(`${addDays(s.date, -1)}T07:00:00Z`);
    expect(parisHour(eveningBefore)).toBe(18);

    expect((await sendDueReminders(db, send, "https://runelio.fr", eveningBefore)).sent).toBe(0); // pas activé
    await setReminderPreference(db, U, true);
    expect((await sendDueReminders(db, send, "https://runelio.fr", morningBefore)).skipped).toBe("too_early");
    expect((await sendDueReminders(db, send, "https://runelio.fr", eveningBefore)).sent).toBe(1);
    expect((await sendDueReminders(db, send, "https://runelio.fr", eveningBefore)).sent).toBe(0); // idempotent
    expect(sent[0]).toMatch(/^user_run@example.test\|Demain : /);
  });

  it("aucun rappel si l'abonnement a pris fin, et nouvel essai si l'envoi échoue", async () => {
    await setReminderPreference(db, U, true);
    const s = (await planSessions()).find((x) => x.type !== "race")!;
    const evening = new Date(`${addDays(s.date, -1)}T17:00:00Z`);
    await expect(sendDueReminders(db, async () => { throw new Error("SMTP"); }, "https://runelio.fr", evening)).resolves.toMatchObject({ sent: 0 });
    const [row] = await db.select().from(trainingSession).where(eq(trainingSession.id, s.id));
    expect(row.reminderSentAt).toBeNull();
    await db.update(subscription).set({ status: "canceled" }).where(eq(subscription.userId, U));
    expect((await sendDueReminders(db, send, "https://runelio.fr", evening)).sent).toBe(0);
  });
});

describe("tableau de bord admin", () => {
  it("compte inscrits, abonnés, résiliations", async () => {
    await subscribe(OTHER, "canceled");
    await db.update(subscription).set({ canceledAt: new Date() }).where(eq(subscription.userId, OTHER));
    await db.insert(userPreference).values({ userId: U, reminderEmail: true });
    const s = await getAdminStats(db);
    expect(s.users).toBe(2);
    expect(s.activeSubscriptions).toBe(1);
    expect(s.cancellations30d).toBe(1);
    expect(s.withProfile).toBe(1);
    expect(s.plansGenerated).toBe(1);
    expect(s.reminderOptIns).toBe(1);
  });
});
