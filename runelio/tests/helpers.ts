import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Db } from "@/db";
import * as schema from "@/db/schema";
import type { WhopGateway, WhopMembership, WhopPlan } from "@/server/whop";

/** Base PostgreSQL en mémoire (PGlite) avec les vraies migrations. */
export async function createTestDb(): Promise<Db> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./drizzle" });
  return db as unknown as Db;
}

/** Vide toutes les tables entre deux tests (plus rapide que recréer la base). */
export async function resetDb(db: Db) {
  const tables = await db.execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  const rows = (tables as unknown as { rows: { tablename: string }[] }).rows;
  if (rows.length) {
    await db.execute(sql.raw(`TRUNCATE ${rows.map((r) => `"${r.tablename}"`).join(", ")} CASCADE`));
  }
}

export async function createUser(db: Db, id = "user_1", email = `${id}@example.test`) {
  await db.insert(schema.user).values({ id, name: "Coureur Test", email, emailVerified: true, adult: true });
  return id;
}

export const baseProfile = {
  goal: "10k" as const,
  raceDate: null,
  horizonWeeks: 10,
  targetTimeSec: null,
  level: "intermediate" as const,
  experience: "6to24m" as const,
  runsPerWeek: 3,
  weeklyVolumeKm: 20,
  longestRunKm: 10,
  refDistanceKm: null,
  refTimeSec: null,
  availableDays: [1, 3, 6],
  restDays: [],
  timeSlots: {},
  longRunDay: 6,
  maxSessionMinutes: 75,
};

/** Faux Whop en mémoire : aucune requête réseau, comportement contrôlé. */
export class FakeWhop implements WhopGateway {
  memberships = new Map<string, WhopMembership>();
  calls: string[] = [];

  setMembership(m: Partial<WhopMembership> & { id: string }) {
    this.memberships.set(m.id, {
      status: "active",
      cancel_at_period_end: false,
      current_period_end: new Date(Date.now() + 30 * 86400_000).toISOString(),
      plan_id: "plan_test",
      product_id: "prod_test",
      metadata: {},
      user_id: "user_whop",
      created_at: new Date().toISOString(),
      ...this.memberships.get(m.id),
      ...m,
    });
  }
  async createCheckout(input: { userId: string; redirectUrl: string }) {
    this.calls.push(`checkout:${input.userId}`);
    return { id: `ch_${this.calls.length}`, purchase_url: `https://whop.com/checkout/ch_${this.calls.length}` };
  }
  async getMembership(id: string) {
    this.calls.push(`get:${id}`);
    const m = this.memberships.get(id);
    if (!m) throw new Error("not found");
    return m;
  }
  async cancelMembership(id: string, atPeriodEnd: boolean) {
    this.calls.push(`cancel:${id}:${atPeriodEnd}`);
    this.setMembership({ id, ...(atPeriodEnd ? { cancel_at_period_end: true, status: "canceling" } : { status: "canceled" }) });
    return this.memberships.get(id)!;
  }
  async setCancelAtPeriodEnd(id: string, value: boolean) {
    this.calls.push(`patch:${id}:${value}`);
    this.setMembership({ id, cancel_at_period_end: value, status: value ? "canceling" : "active" });
    return this.memberships.get(id)!;
  }
  async getPlan(): Promise<WhopPlan> {
    throw new Error("not used");
  }
}
