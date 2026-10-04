/** Indicateurs du tableau de bord administrateur. */
import { sql } from "drizzle-orm";
import type { Db } from "@/db";

export type AdminStats = {
  users: number;
  verifiedUsers: number;
  signups7d: number;
  signups30d: number;
  withProfile: number;
  activeSubscriptions: number;
  canceling: number;
  pastDue: number;
  cancellations30d: number;
  newSubscriptions30d: number;
  payments30d: number;
  revenue30dCents: number;
  plansGenerated: number;
  sessionsCompleted30d: number;
  reminderOptIns: number;
};

const n = (v: unknown) => Number(v ?? 0);

export async function getAdminStats(db: Db, now = new Date()): Promise<AdminStats> {
  const d7 = new Date(now.getTime() - 7 * 86400_000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 86400_000).toISOString();
  const res = await db.execute<Record<string, unknown>>(sql`
    SELECT
      (SELECT count(*) FROM "user") AS users,
      (SELECT count(*) FROM "user" WHERE email_verified) AS verified_users,
      (SELECT count(*) FROM "user" WHERE created_at >= ${d7}::timestamptz) AS signups_7d,
      (SELECT count(*) FROM "user" WHERE created_at >= ${d30}::timestamptz) AS signups_30d,
      (SELECT count(*) FROM runner_profile) AS with_profile,
      (SELECT count(DISTINCT user_id) FROM subscription WHERE status IN ('active','trialing') AND NOT cancel_at_period_end) AS active_subs,
      (SELECT count(DISTINCT user_id) FROM subscription WHERE status = 'canceling' OR (status IN ('active','trialing') AND cancel_at_period_end)) AS canceling,
      (SELECT count(DISTINCT user_id) FROM subscription WHERE status = 'past_due') AS past_due,
      (SELECT count(*) FROM subscription WHERE canceled_at >= ${d30}::timestamptz) AS cancellations_30d,
      (SELECT count(*) FROM subscription WHERE created_at >= ${d30}::timestamptz) AS new_subs_30d,
      (SELECT count(*) FROM payment WHERE status = 'succeeded' AND coalesce(paid_at, created_at) >= ${d30}::timestamptz) AS payments_30d,
      (SELECT coalesce(sum(amount_cents), 0) FROM payment WHERE status = 'succeeded' AND coalesce(paid_at, created_at) >= ${d30}::timestamptz) AS revenue_30d,
      (SELECT count(*) FROM training_plan) AS plans,
      (SELECT count(*) FROM training_session WHERE completed_at >= ${d30}::timestamptz) AS sessions_30d,
      (SELECT count(*) FROM user_preference WHERE reminder_email) AS reminder_opt_ins
  `);
  const r = ((res as unknown as { rows: Record<string, unknown>[] }).rows ?? [])[0] ?? {};
  return {
    users: n(r.users),
    verifiedUsers: n(r.verified_users),
    signups7d: n(r.signups_7d),
    signups30d: n(r.signups_30d),
    withProfile: n(r.with_profile),
    activeSubscriptions: n(r.active_subs),
    canceling: n(r.canceling),
    pastDue: n(r.past_due),
    cancellations30d: n(r.cancellations_30d),
    newSubscriptions30d: n(r.new_subs_30d),
    payments30d: n(r.payments_30d),
    revenue30dCents: n(r.revenue_30d),
    plansGenerated: n(r.plans),
    sessionsCompleted30d: n(r.sessions_30d),
    reminderOptIns: n(r.reminder_opt_ins),
  };
}
