import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { availabilitySchema } from "@/lib/validation";
import { assertSameOrigin, handle } from "@/server/api";
import { adjustPlan } from "@/server/plans";
import { enforceRateLimit } from "@/server/rate-limit";
import { requireApiUser } from "@/server/session";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireApiUser();
  const db = getDb();
  await enforceRateLimit(db, `adjust:${u.id}`, 20, 3600);
  const input = availabilitySchema.parse(await req.json());
  return NextResponse.json(await adjustPlan(db, u.id, input));
});
