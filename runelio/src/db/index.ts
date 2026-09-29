import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { __runelioDb?: Db; __runelioPool?: Pool };

function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL n'est pas défini.");
  }
  const pool =
    globalForDb.__runelioPool ?? new Pool({ connectionString: url, max: 10 });
  globalForDb.__runelioPool = pool;
  return drizzle(pool, { schema }) as unknown as Db;
}

/** Connexion paresseuse : aucune connexion n'est ouverte au moment du build. */
export function getDb(): Db {
  if (!globalForDb.__runelioDb) {
    globalForDb.__runelioDb = createDb();
  }
  return globalForDb.__runelioDb;
}

export { schema };
