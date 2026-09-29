import { and, asc, eq, gte, isNotNull, isNull, lt } from "drizzle-orm";
import type { Db } from "@/db";
import { planWeek, runnerProfile, trainingPlan, trainingSession } from "@/db/schema";
import { addDays, diffDays, mondayOf, todayIso } from "@/domain/dates";
import { planRunning, PlanInputError } from "@/domain/planning/running";
import type { GeneratedPlan, RunningPlanInput } from "@/domain/planning/types";
import { isAvailableGoal } from "@/domain/sports";
import type { AvailabilityInput, ProfileInput } from "@/lib/validation";
import { canGeneratePlan, canViewPlan } from "./access";
import { getCurrentSubscription } from "./billing";
import { badRequest, notFound, paymentRequired } from "./errors";

export type ProfileRow = typeof runnerProfile.$inferSelect;

export async function getProfile(db: Db, userId: string): Promise<ProfileRow | null> {
  const [p] = await db.select().from(runnerProfile).where(eq(runnerProfile.userId, userId));
  return p ?? null;
}

export async function saveProfile(db: Db, userId: string, input: ProfileInput): Promise<void> {
  const values = {
    goal: input.goal,
    raceDate: input.raceDate ?? null,
    horizonWeeks: input.raceDate ? null : (input.horizonWeeks ?? null),
    targetTimeSec: input.targetTimeSec ?? null,
    level: input.level,
    experience: input.experience,
    runsPerWeek: input.runsPerWeek,
    weeklyVolumeKm: input.weeklyVolumeKm,
    longestRunKm: input.longestRunKm,
    refDistanceKm: input.refDistanceKm ?? null,
    refTimeSec: input.refTimeSec ?? null,
    availableDays: [...new Set(input.availableDays)].sort(),
    restDays: [...new Set(input.restDays)].sort(),
    timeSlots: input.timeSlots,
    longRunDay: input.longRunDay ?? null,
    maxSessionMinutes: input.maxSessionMinutes,
  };
  await db
    .insert(runnerProfile)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: runnerProfile.userId, set: { ...values, updatedAt: new Date() } });
}

export function profileToInput(p: ProfileRow): RunningPlanInput {
  if (!isAvailableGoal(p.goal)) throw badRequest("Cet objectif n'est pas encore disponible.");
  return {
    goal: p.goal,
    raceDate: p.raceDate,
    horizonWeeks: p.horizonWeeks,
    targetTimeSec: p.targetTimeSec,
    level: p.level,
    experience: p.experience,
    runsPerWeek: p.runsPerWeek,
    weeklyVolumeKm: p.weeklyVolumeKm,
    longestRunKm: p.longestRunKm,
    refDistanceKm: p.refDistanceKm,
    refTimeSec: p.refTimeSec,
    availableDays: p.availableDays,
    restDays: p.restDays,
    longRunDay: p.longRunDay,
    maxSessionMinutes: p.maxSessionMinutes,
  };
}

function wrapPlanError<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    if (e instanceof PlanInputError) throw badRequest(e.message);
    throw e;
  }
}

async function insertPlanContent(tx: Pick<Db, "insert">, planId: string, plan: GeneratedPlan) {
  if (plan.weeks.length) {
    await tx.insert(planWeek).values(plan.weeks.map((w) => ({ planId, ...w })));
  }
  if (plan.sessions.length) {
    await tx.insert(trainingSession).values(plan.sessions.map((s) => ({ planId, ...s })));
  }
}

/**
 * Génère le programme. Règle critique : refusé sans abonnement actif confirmé
 * côté serveur (statut synchronisé depuis Whop via webhook signé).
 */
export async function generatePlanForUser(db: Db, userId: string, now = new Date()) {
  const sub = await getCurrentSubscription(db, userId);
  if (!canGeneratePlan(sub, now)) throw paymentRequired();
  const profile = await getProfile(db, userId);
  if (!profile) throw badRequest("Complétez d'abord votre questionnaire.");
  const input = profileToInput(profile);
  const startDate = addDays(todayIso(now), 1);
  const plan = wrapPlanError(() => planRunning(input, { startDate }));

  return db.transaction(async (tx) => {
    await tx
      .update(trainingPlan)
      .set({ status: "archived" })
      .where(and(eq(trainingPlan.userId, userId), eq(trainingPlan.status, "active")));
    const [row] = await tx
      .insert(trainingPlan)
      .values({
        userId,
        goal: input.goal,
        startDate: plan.startDate,
        raceDate: plan.raceDate,
        inputSnapshot: input,
        warnings: plan.warnings,
        paces: plan.paces as Record<string, number> | null,
        generatorVersion: plan.generatorVersion,
      })
      .returning({ id: trainingPlan.id });
    await insertPlanContent(tx, row.id, plan);
    return row.id;
  });
}

export async function getActivePlan(db: Db, userId: string, now = new Date()) {
  const sub = await getCurrentSubscription(db, userId);
  if (!canViewPlan(sub, now)) throw paymentRequired();
  const [plan] = await db
    .select()
    .from(trainingPlan)
    .where(and(eq(trainingPlan.userId, userId), eq(trainingPlan.status, "active")))
    .limit(1);
  if (!plan) return null;
  const [weeks, sessions] = await Promise.all([
    db.select().from(planWeek).where(eq(planWeek.planId, plan.id)).orderBy(asc(planWeek.weekIndex)),
    db.select().from(trainingSession).where(eq(trainingSession.planId, plan.id)).orderBy(asc(trainingSession.date)),
  ]);
  return { plan, weeks, sessions };
}

export async function setSessionCompleted(db: Db, userId: string, sessionId: string, completed: boolean) {
  const sub = await getCurrentSubscription(db, userId);
  if (!canViewPlan(sub)) throw paymentRequired();
  const [row] = await db
    .select({ id: trainingSession.id, userId: trainingPlan.userId })
    .from(trainingSession)
    .innerJoin(trainingPlan, eq(trainingPlan.id, trainingSession.planId))
    .where(eq(trainingSession.id, sessionId));
  // Même réponse si la séance n'existe pas ou appartient à un autre compte.
  if (!row || row.userId !== userId) throw notFound("Séance introuvable.");
  await db
    .update(trainingSession)
    .set({ completedAt: completed ? new Date() : null })
    .where(eq(trainingSession.id, sessionId));
}

/**
 * Réajuste les semaines à venir : nouvelles disponibilités et prise en compte
 * des séances réellement réalisées sur les 14 derniers jours.
 */
export async function adjustPlan(db: Db, userId: string, availability: AvailabilityInput, now = new Date()) {
  const sub = await getCurrentSubscription(db, userId);
  if (!canGeneratePlan(sub, now)) throw paymentRequired();
  const profile = await getProfile(db, userId);
  if (!profile) throw badRequest("Questionnaire introuvable.");
  const [plan] = await db
    .select()
    .from(trainingPlan)
    .where(and(eq(trainingPlan.userId, userId), eq(trainingPlan.status, "active")));
  if (!plan) throw notFound("Aucun programme actif.");

  const today = todayIso(now);
  const start = addDays(today, 1);
  if (start > plan.raceDate) throw badRequest("Ce programme est terminé : générez-en un nouveau.");

  await db
    .update(runnerProfile)
    .set({
      availableDays: availability.availableDays,
      restDays: availability.restDays,
      timeSlots: availability.timeSlots,
      longRunDay: availability.longRunDay ?? null,
      maxSessionMinutes: availability.maxSessionMinutes,
      updatedAt: new Date(),
    })
    .where(eq(runnerProfile.userId, userId));

  const past = await db
    .select()
    .from(trainingSession)
    .where(and(eq(trainingSession.planId, plan.id), lt(trainingSession.date, start), gte(trainingSession.date, addDays(today, -13))));
  const planned = past.filter((s) => s.type !== "race");
  const done = planned.filter((s) => s.completedAt);
  const ratio = planned.length ? done.length / planned.length : 1;
  const volumeScale = ratio < 0.5 ? 0.85 : ratio < 0.75 ? 0.95 : 1;

  const elapsed = Math.max(0, Math.floor(diffDays(mondayOf(plan.startDate), mondayOf(start)) / 7));
  const weeks = await db.select().from(planWeek).where(eq(planWeek.planId, plan.id));
  const lastWeek = weeks.find((w) => w.weekIndex === elapsed - 1);
  const doneLong = done.filter((s) => s.type === "long").map((s) => s.distanceKm ?? 0);

  const base = profileToInput({ ...profile, ...availability, longRunDay: availability.longRunDay ?? null });
  const input: RunningPlanInput = {
    ...base,
    raceDate: plan.raceDate,
    horizonWeeks: null,
    weeklyVolumeKm: lastWeek ? lastWeek.targetVolumeKm : base.weeklyVolumeKm,
    longestRunKm: doneLong.length ? Math.max(...doneLong) : base.longestRunKm,
  };
  const generated = wrapPlanError(() =>
    planRunning(input, { startDate: start, elapsedWeeks: elapsed, weekIndexOffset: elapsed, volumeScale }),
  );
  const adjustNote = {
    code: "adjusted",
    severity: "info" as const,
    message:
      volumeScale < 1
        ? `Programme réajusté : ${Math.round(ratio * 100)} % des séances des deux dernières semaines ont été réalisées, la charge a été allégée.`
        : "Programme réajusté selon vos nouvelles disponibilités.",
  };

  // Les séances futures déjà marquées réalisées sont conservées ; on ne double pas leur journée.
  const keptDone = await db
    .select({ date: trainingSession.date })
    .from(trainingSession)
    .where(and(eq(trainingSession.planId, plan.id), gte(trainingSession.date, start), isNotNull(trainingSession.completedAt)));
  const keptDates = new Set(keptDone.map((s) => s.date));
  const content = { ...generated, sessions: generated.sessions.filter((s) => !keptDates.has(s.date)) };

  await db.transaction(async (tx) => {
    await tx
      .delete(trainingSession)
      .where(and(eq(trainingSession.planId, plan.id), gte(trainingSession.date, start), isNull(trainingSession.completedAt)));
    await tx.delete(planWeek).where(and(eq(planWeek.planId, plan.id), gte(planWeek.weekIndex, elapsed)));
    await insertPlanContent(tx, plan.id, content);
    await tx
      .update(trainingPlan)
      .set({
        adjustedAt: new Date(),
        warnings: [...plan.warnings.filter((w) => w.code !== "adjusted"), adjustNote],
      })
      .where(eq(trainingPlan.id, plan.id));
  });
  return { ratio, volumeScale };
}
