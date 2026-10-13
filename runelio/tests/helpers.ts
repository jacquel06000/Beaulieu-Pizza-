import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Db } from "@/db";
import * as schema from "@/db/schema";
import type { GatewayPrice, GatewaySubscription, PaymentGateway } from "@/server/stripe";

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

/** Faux Stripe en mémoire : aucune requête réseau, comportement contrôlé. */
export class FakeStripe implements PaymentGateway {
  subscriptions = new Map<string, GatewaySubscription>();
  calls: string[] = [];

  setSubscription(s: Partial<GatewaySubscription> & { id: string }) {
    this.subscriptions.set(s.id, {
      customerId: "cus_test",
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date(Date.now() + 30 * 86400_000),
      priceId: "price_test",
      userId: null,
      ...this.subscriptions.get(s.id),
      ...s,
    });
  }
  async createCheckout(input: { userId: string; customerId: string | null }) {
    this.calls.push(`checkout:${input.userId}:${input.customerId ?? "nouveau"}`);
    const id = `cs_test_${this.calls.length}`;
    return { id, url: `https://checkout.stripe.com/c/pay/${id}` };
  }
  async getSubscription(id: string) {
    this.calls.push(`get:${id}`);
    const s = this.subscriptions.get(id);
    if (!s) throw new Error("not found");
    return s;
  }
  async setCancelAtPeriodEnd(id: string, value: boolean) {
    this.calls.push(`cancel_at_period_end:${id}:${value}`);
    this.setSubscription({ id, cancelAtPeriodEnd: value });
    return this.subscriptions.get(id)!;
  }
  async cancelNow(id: string) {
    this.calls.push(`cancel_now:${id}`);
    this.setSubscription({ id, status: "canceled" });
    return this.subscriptions.get(id)!;
  }
  async createPortalSession(customerId: string) {
    this.calls.push(`portal:${customerId}`);
    return { url: `https://billing.stripe.com/p/session/${customerId}` };
  }
  async getPrice(): Promise<GatewayPrice> {
    throw new Error("not used");
  }
}
