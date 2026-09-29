import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { assertSameOrigin, handle } from "@/server/api";
import { generatePlanForUser } from "@/server/plans";
import { enforceRateLimit } from "@/server/rate-limit";
import { requireApiUser } from "@/server/session";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireApiUser();
  const db = getDb();
  await enforceRateLimit(db, `generate:${u.id}`, 10, 3600);
  const planId = await generatePlanForUser(db, u.id);
  return NextResponse.json({ planId });
});
