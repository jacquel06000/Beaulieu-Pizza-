/**
 * Données de démonstration (développement uniquement) — aucune donnée personnelle réelle.
 *
 *   npm run db:seed
 *
 * Crée :
 *  - demo@runelio.test / demo-runelio-2026 : compte gratuit avec questionnaire rempli (sans abonnement) ;
 *  - abonne@runelio.test / demo-runelio-2026 : compte avec un abonnement FICTIF actif et un programme ;
 *  - admin@runelio.test / demo-runelio-2026 : administrateur ;
 *  - un cadeau du mois en brouillon (non validé, donc invisible).
 *
 * L'abonnement fictif (mem_demo_…) ne correspond à aucun paiement : ce script refuse
 * de s'exécuter en production.
 */
import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { account, giveaway, subscription, user } from "../src/db/schema";
import { generatePlanForUser, saveProfile } from "../src/server/plans";

if (process.env.NODE_ENV === "production") {
  console.error("Refus : le seed de démonstration ne doit pas être exécuté en production.");
  process.exit(1);
}

const PASSWORD = "demo-runelio-2026";

async function upsertUser(id: string, email: string, name: string, role: "user" | "admin" = "user") {
  const db = getDb();
  const [existing] = await db.select().from(user).where(eq(user.email, email));
  if (existing) return existing.id;
  await db.insert(user).values({ id, email, name, emailVerified: true, role, adult: true });
  await db.insert(account).values({ id: `acc_${id}`, accountId: id, providerId: "credential", userId: id, password: await hashPassword(PASSWORD) });
  return id;
}

const inDays = (d: number) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};

async function main() {
  const db = getDb();
  const demo = await upsertUser("demo_free", "demo@runelio.test", "Camille (démo)");
  await saveProfile(db, demo, {
    goal: "10k",
    raceDate: inDays(70),
    horizonWeeks: null,
    targetTimeSec: 55 * 60,
    level: "beginner",
    experience: "lt6m",
    runsPerWeek: 2,
    weeklyVolumeKm: 12,
    longestRunKm: 6,
    refDistanceKm: 5,
    refTimeSec: 29 * 60,
    availableDays: [1, 3, 6],
    restDays: [],
    timeSlots: { "1": "evening", "3": "evening", "6": "morning" },
    longRunDay: 6,
    maxSessionMinutes: 60,
  });

  const sub = await upsertUser("demo_sub", "abonne@runelio.test", "Sam (démo)");
  await saveProfile(db, sub, {
    goal: "half",
    raceDate: inDays(100),
    horizonWeeks: null,
    targetTimeSec: null,
    level: "intermediate",
    experience: "6to24m",
    runsPerWeek: 3,
    weeklyVolumeKm: 25,
    longestRunKm: 12,
    refDistanceKm: 10,
    refTimeSec: 52 * 60,
    availableDays: [1, 3, 5, 6],
    restDays: [],
    timeSlots: {},
    longRunDay: 6,
    maxSessionMinutes: 120,
  });
  await db
    .insert(subscription)
    .values({ userId: sub, whopMembershipId: "mem_demo_fictif", status: "active", currentPeriodEnd: new Date(Date.now() + 30 * 86400_000) })
    .onConflictDoNothing();
  await generatePlanForUser(db, sub);

  await upsertUser("demo_admin", "admin@runelio.test", "Admin (démo)", "admin");

  const [g] = await db.select().from(giveaway).limit(1);
  if (!g) {
    await db.insert(giveaway).values({
      title: "Exemple — paire de chaussures de running",
      prizeDescription: "Lot fictif de démonstration.",
      prizeValueCents: 12000,
      numberOfWinners: 1,
      startsAt: new Date(inDays(1)),
      endsAt: new Date(inDays(30)),
      drawAt: new Date(inDays(31)),
      eligibilityCriteria: "À définir dans le règlement (démonstration).",
      drawMethod: "À définir dans le règlement (démonstration).",
    });
  }
  console.info(`Seed terminé. Mot de passe des comptes de démonstration : ${PASSWORD}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
