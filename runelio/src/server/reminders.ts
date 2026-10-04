/**
 * Rappels par e-mail la veille d'une séance (désactivés par défaut, activables
 * dans « Compte »). Appelé toutes les heures par une tâche planifiée ; envoie
 * à partir de 17 h (heure de Paris), une seule fois par séance.
 */
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/db";
import { trainingPlan, trainingSession, user, userPreference } from "@/db/schema";
import { addDays, todayIso } from "@/domain/dates";
import { canViewPlan } from "./access";
import { getCurrentSubscription } from "./billing";
import { layoutEmail } from "./mailer";

export const REMINDER_HOUR = 17;

export function parisHour(now: Date): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false }).format(now)) % 24;
}

type Mail = { to: string; subject: string; text: string; html?: string };

export async function sendDueReminders(db: Db, send: (m: Mail) => Promise<void>, appUrl: string, now = new Date()) {
  if (parisHour(now) < REMINDER_HOUR) return { sent: 0, skipped: "too_early" as const };
  const tomorrow = addDays(todayIso(now), 1);
  const rows = await db
    .select({ session: trainingSession, userId: trainingPlan.userId, email: user.email, name: user.name })
    .from(trainingSession)
    .innerJoin(trainingPlan, eq(trainingPlan.id, trainingSession.planId))
    .innerJoin(userPreference, eq(userPreference.userId, trainingPlan.userId))
    .innerJoin(user, eq(user.id, trainingPlan.userId))
    .where(
      and(
        eq(trainingSession.date, tomorrow),
        eq(trainingPlan.status, "active"),
        eq(userPreference.reminderEmail, true),
        isNull(trainingSession.reminderSentAt),
        isNull(trainingSession.completedAt),
      ),
    );

  let sent = 0;
  for (const r of rows) {
    const sub = await getCurrentSubscription(db, r.userId);
    if (!canViewPlan(sub, now)) continue;
    const s = r.session;
    // Marque d'abord (idempotence en cas d'appels concurrents), puis envoie.
    const claimed = await db
      .update(trainingSession)
      .set({ reminderSentAt: now })
      .where(and(eq(trainingSession.id, s.id), isNull(trainingSession.reminderSentAt)))
      .returning({ id: trainingSession.id });
    if (!claimed.length) continue;
    const details = [
      `${s.title} — ${s.durationMin} min${s.distanceKm ? ` (≈ ${s.distanceKm} km)` : ""}`,
      `Intensité : ${s.intensity.label} (${s.intensity.rpe})${s.intensity.pace ? `, ${s.intensity.pace}` : ""}`,
      "",
      ...s.structure.map((l) => `• ${l}`),
      "",
      "Pour ne plus recevoir ces rappels : Mon espace → Compte → Rappels.",
    ].join("\n");
    try {
      await send({
        to: r.email,
        subject: `Demain : ${s.title} (${s.durationMin} min)`,
        ...layoutEmail(`Bonjour ${r.name}, votre séance de demain`, details, { label: "Voir mon programme", url: `${appUrl}/espace/programme` }),
      });
      sent++;
    } catch (e) {
      // Échec d'envoi : on libère la séance pour un nouvel essai à l'heure suivante.
      await db.update(trainingSession).set({ reminderSentAt: null }).where(eq(trainingSession.id, s.id));
      console.error("[reminders]", e);
    }
  }
  return { sent, skipped: null };
}

export async function getReminderPreference(db: Db, userId: string): Promise<boolean> {
  const [pref] = await db.select({ v: userPreference.reminderEmail }).from(userPreference).where(eq(userPreference.userId, userId));
  return pref?.v ?? false;
}

export async function setReminderPreference(db: Db, userId: string, enabled: boolean) {
  await db
    .insert(userPreference)
    .values({ userId, reminderEmail: enabled })
    .onConflictDoUpdate({ target: userPreference.userId, set: { reminderEmail: enabled, updatedAt: new Date() } });
}
