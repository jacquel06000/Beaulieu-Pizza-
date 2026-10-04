/**
 * Outils du programme : déplacement d'une séance et ressenti déclaré.
 */
import { and, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { trainingPlan, trainingSession } from "@/db/schema";
import { diffDays, mondayOf, todayIso } from "@/domain/dates";
import { canGeneratePlan, canViewPlan } from "./access";
import { getCurrentSubscription } from "./billing";
import { badRequest, notFound, paymentRequired } from "./errors";

export const FEELINGS = ["easy", "ok", "hard", "too_hard"] as const;
export type Feeling = (typeof FEELINGS)[number];
export const HARD_TYPES = new Set(["intervals", "tempo", "race_pace", "hills", "fartlek", "long", "race"]);

async function loadOwnedSession(db: Db, userId: string, sessionId: string) {
  const [row] = await db
    .select({ session: trainingSession, plan: trainingPlan })
    .from(trainingSession)
    .innerJoin(trainingPlan, eq(trainingPlan.id, trainingSession.planId))
    .where(eq(trainingSession.id, sessionId));
  // Même réponse si la séance n'existe pas ou appartient à un autre compte.
  if (!row || row.plan.userId !== userId) throw notFound("Séance introuvable.");
  return row;
}

/**
 * Déplace une séance vers un autre jour libre de la même semaine (lundi → dimanche).
 * Règles : pas dans le passé, pas le jour ni après la course, pas sur un jour déjà occupé,
 * pas une séance déjà réalisée ni la course elle-même.
 */
export async function moveSession(db: Db, userId: string, sessionId: string, newDate: string, now = new Date()) {
  const sub = await getCurrentSubscription(db, userId);
  if (!canGeneratePlan(sub, now)) throw paymentRequired();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) throw badRequest("Date invalide.");
  const { session: s, plan } = await loadOwnedSession(db, userId, sessionId);
  const today = todayIso(now);

  if (s.type === "race") throw badRequest("Le jour de course ne peut pas être déplacé.");
  if (s.completedAt) throw badRequest("Cette séance est déjà réalisée.");
  if (newDate === s.date) return { date: s.date, warning: null };
  if (mondayOf(newDate) !== mondayOf(s.date)) throw badRequest("Une séance ne peut être déplacée que dans la même semaine.");
  if (newDate < today) throw badRequest("Impossible de déplacer une séance dans le passé.");
  if (newDate >= plan.raceDate) throw badRequest("Impossible de placer une séance le jour de la course ou après.");

  const sameDay = await db
    .select({ id: trainingSession.id })
    .from(trainingSession)
    .where(and(eq(trainingSession.planId, plan.id), eq(trainingSession.date, newDate)));
  if (sameDay.length) throw badRequest("Une séance est déjà prévue ce jour-là.");

  await db
    .update(trainingSession)
    .set({ date: newDate, originalDate: s.originalDate ?? s.date, reminderSentAt: null })
    .where(eq(trainingSession.id, s.id));

  // Avertissement (non bloquant) : deux séances exigeantes collées.
  let warning: string | null = null;
  if (HARD_TYPES.has(s.type)) {
    const neighbours = await db
      .select({ date: trainingSession.date, type: trainingSession.type })
      .from(trainingSession)
      .where(eq(trainingSession.planId, plan.id));
    const close = neighbours.some(
      (n) => n.date !== newDate && HARD_TYPES.has(n.type) && Math.abs(diffDays(n.date, newDate)) === 1,
    );
    if (close) warning = "Cette séance se retrouve juste avant ou après une autre séance exigeante : courez-la à l'écoute de vos sensations.";
  }
  return { date: newDate, warning };
}

export { movableDays } from "@/lib/plan-days";

/** Enregistre le ressenti d'une séance (et la marque réalisée). `null` efface le ressenti. */
export async function setFeeling(db: Db, userId: string, sessionId: string, feeling: Feeling | null, now = new Date()) {
  const sub = await getCurrentSubscription(db, userId);
  if (!canViewPlan(sub, now)) throw paymentRequired();
  if (feeling !== null && !FEELINGS.includes(feeling)) throw badRequest("Ressenti invalide.");
  const { session: s } = await loadOwnedSession(db, userId, sessionId);
  await db
    .update(trainingSession)
    .set({ feeling, completedAt: feeling ? (s.completedAt ?? now) : s.completedAt })
    .where(eq(trainingSession.id, s.id));
}

/**
 * Coefficient de charge tiré des ressentis récents (utilisé au réajustement).
 * Beaucoup de séances « difficiles » ou « trop difficiles » → on allège.
 */
export function feelingScale(feelings: (string | null)[]): { scale: number; tooHard: number; hardShare: number } {
  const rated = feelings.filter((f): f is string => Boolean(f));
  const tooHard = rated.filter((f) => f === "too_hard").length;
  const hard = rated.filter((f) => f === "hard" || f === "too_hard").length;
  const hardShare = rated.length ? hard / rated.length : 0;
  const scale = tooHard >= 2 || (rated.length >= 3 && hardShare > 0.5) ? 0.9 : 1;
  return { scale, tooHard, hardShare };
}
