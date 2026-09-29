import { getDb } from "@/db";
import { handle } from "@/server/api";
import { exportUserData } from "@/server/gdpr";
import { enforceRateLimit } from "@/server/rate-limit";
import { requireApiUser } from "@/server/session";

export const GET = handle(async () => {
  const u = await requireApiUser();
  const db = getDb();
  await enforceRateLimit(db, `export:${u.id}`, 5, 3600);
  const data = await exportUserData(db, u.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="runelio-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
});
