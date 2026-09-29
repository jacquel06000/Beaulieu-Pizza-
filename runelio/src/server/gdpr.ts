import { and, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "@/db";
import {
  checkoutAttempt,
  consentLog,
  giveawayEntry,
  invoice,
  payment,
  planWeek,
  runnerProfile,
  session,
  subscription,
  trainingPlan,
  trainingSession,
  user,
} from "@/db/schema";
import { TEXT_VERSIONS } from "@/lib/config";

/** Export (droit d'accès / portabilité) de toutes les données liées au compte. */
export async function exportUserData(db: Db, userId: string) {
  const [u] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      phone: user.phone,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, userId));
  const plans = await db.select().from(trainingPlan).where(eq(trainingPlan.userId, userId));
  const planIds = plans.map((p) => p.id);
  const [profile, subs, pays, invs, weeks, sessions, consents, entries, checkouts, sessionsAuth] = await Promise.all([
    db.select().from(runnerProfile).where(eq(runnerProfile.userId, userId)),
    db.select().from(subscription).where(eq(subscription.userId, userId)),
    db.select().from(payment).where(eq(payment.userId, userId)),
    db.select().from(invoice).where(eq(invoice.userId, userId)),
    planIds.length ? db.select().from(planWeek).where(inArray(planWeek.planId, planIds)) : Promise.resolve([]),
    planIds.length ? db.select().from(trainingSession).where(inArray(trainingSession.planId, planIds)) : Promise.resolve([]),
    db.select().from(consentLog).where(eq(consentLog.userId, userId)),
    db.select().from(giveawayEntry).where(eq(giveawayEntry.userId, userId)),
    db.select().from(checkoutAttempt).where(eq(checkoutAttempt.userId, userId)),
    db
      .select({ createdAt: session.createdAt, expiresAt: session.expiresAt, ipAddress: session.ipAddress, userAgent: session.userAgent })
      .from(session)
      .where(eq(session.userId, userId)),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    service: "runelio.fr",
    account: u,
    runnerProfile: profile[0] ?? null,
    subscriptions: subs,
    payments: pays,
    invoices: invs,
    checkoutAttempts: checkouts,
    trainingPlans: plans.map((p) => ({
      ...p,
      weeks: weeks.filter((w) => w.planId === p.id),
      sessions: sessions.filter((s) => s.planId === p.id),
    })),
    consents,
    giveawayEntries: entries,
    activeSessions: sessionsAuth,
  };
}

export async function getMarketingConsent(db: Db, userId: string): Promise<boolean> {
  const [last] = await db
    .select({ granted: consentLog.granted })
    .from(consentLog)
    .where(and(eq(consentLog.userId, userId), eq(consentLog.purpose, "marketing_email")))
    .orderBy(desc(consentLog.createdAt))
    .limit(1);
  return last?.granted ?? false;
}

export async function setMarketingConsent(db: Db, userId: string, granted: boolean) {
  await db.insert(consentLog).values({ userId, purpose: "marketing_email", granted, textVersion: TEXT_VERSIONS.marketing });
}
