import { sql } from "drizzle-orm";
import type { Db } from "@/db";
import { appRateLimit } from "@/db/schema";
import { tooMany } from "./errors";

/** Limiteur à fenêtre fixe stocké en base (fonctionne avec plusieurs instances). */
export async function enforceRateLimit(db: Db, key: string, max: number, windowSec: number): Promise<void> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSec * 1000);
  const ws = windowStart.toISOString();
  const nowIso = now.toISOString();
  const rows = await db
    .insert(appRateLimit)
    .values({ key, count: 1, windowStart: now })
    .onConflictDoUpdate({
      target: appRateLimit.key,
      set: {
        count: sql`CASE WHEN ${appRateLimit.windowStart} < ${ws}::timestamptz THEN 1 ELSE ${appRateLimit.count} + 1 END`,
        windowStart: sql`CASE WHEN ${appRateLimit.windowStart} < ${ws}::timestamptz THEN ${nowIso}::timestamptz ELSE ${appRateLimit.windowStart} END`,
      },
    })
    .returning({ count: appRateLimit.count });
  if ((rows[0]?.count ?? 0) > max) throw tooMany();
}
