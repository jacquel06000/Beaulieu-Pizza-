/**
 * Durées de conservation (politique de confidentialité) :
 * - compte sans connexion pendant 3 ans : avertissement par e-mail 30 jours
 *   avant, puis suppression (sauf abonnement en cours) ;
 * - journal technique des notifications de paiement : 12 mois.
 */
import { and, eq, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { user, userPreference, webhookEvent } from "@/db/schema";
import { canViewPlan } from "./access";
import { getCurrentSubscription } from "./billing";
import { layoutEmail } from "./mailer";

const DAY = 86_400_000;
export const INACTIVITY_DAYS = 3 * 365;
export const WARNING_DAYS = 30;
export const WEBHOOK_LOG_DAYS = 365;

/** Enregistre l'activité d'un utilisateur (au plus une écriture par jour). Annule un avertissement en cours. */
export async function touchLastSeen(db: Db, userId: string, now = new Date()) {
  const dayAgo = new Date(now.getTime() - DAY);
  await db
    .insert(userPreference)
    .values({ userId, lastSeenAt: now })
    .onConflictDoUpdate({
      target: userPreference.userId,
      set: { lastSeenAt: now, inactivityWarnedAt: null },
      setWhere: or(isNull(userPreference.lastSeenAt), lt(userPreference.lastSeenAt, dayAgo)),
    });
}

type Mail = { to: string; subject: string; text: string; html?: string };

export async function runRetention(db: Db, send: (m: Mail) => Promise<void>, appUrl: string, now = new Date()) {
  const warnBefore = new Date(now.getTime() - (INACTIVITY_DAYS - WARNING_DAYS) * DAY);
  const deleteBefore = new Date(now.getTime() - INACTIVITY_DAYS * DAY);
  const warnedBefore = new Date(now.getTime() - WARNING_DAYS * DAY);
  const lastSeen = sql`coalesce(${userPreference.lastSeenAt}, ${user.createdAt})`;

  const rows = await db
    .select({ id: user.id, email: user.email, name: user.name, role: user.role, warnedAt: userPreference.inactivityWarnedAt, lastSeen })
    .from(user)
    .leftJoin(userPreference, eq(userPreference.userId, user.id))
    .where(sql`${lastSeen} < ${warnBefore.toISOString()}::timestamptz`);

  let warned = 0;
  let deleted = 0;
  for (const r of rows) {
    if (r.role === "admin") continue;
    // Un abonnement en cours vaut activité : on ne supprime pas un client qui paie.
    if (canViewPlan(await getCurrentSubscription(db, r.id), now)) continue;
    const seen = new Date(r.lastSeen as string | Date);

    if (!r.warnedAt) {
      await send({
        to: r.email,
        subject: "Runelio — votre compte sera supprimé dans 30 jours",
        ...layoutEmail(
          `Bonjour ${r.name}, votre compte est inactif`,
          "Vous ne vous êtes pas connecté à Runelio depuis près de 3 ans. Conformément à notre politique de confidentialité, votre compte et ses données (questionnaire, programmes) seront supprimés dans 30 jours. Pour le conserver, il suffit de vous connecter.",
          { label: "Me connecter", url: `${appUrl}/connexion` },
        ),
      });
      await db
        .insert(userPreference)
        .values({ userId: r.id, inactivityWarnedAt: now })
        .onConflictDoUpdate({ target: userPreference.userId, set: { inactivityWarnedAt: now } });
      warned++;
    } else if (seen < deleteBefore && r.warnedAt <= warnedBefore) {
      // Suppression : le compte et ses données liées (cascade). Les factures restent (obligation comptable).
      await db.delete(user).where(eq(user.id, r.id));
      deleted++;
    }
  }

  const purged = await db
    .delete(webhookEvent)
    .where(lt(webhookEvent.receivedAt, new Date(now.getTime() - WEBHOOK_LOG_DAYS * DAY)))
    .returning({ id: webhookEvent.id });

  return { warned, deleted, webhookEventsPurged: purged.length };
}

/** Utilisateurs avertis puis revenus : nettoyage défensif (normalement fait par touchLastSeen). */
export async function clearStaleWarnings(db: Db) {
  await db
    .update(userPreference)
    .set({ inactivityWarnedAt: null })
    .where(and(isNotNull(userPreference.inactivityWarnedAt), sql`${userPreference.lastSeenAt} > ${userPreference.inactivityWarnedAt}`));
}
