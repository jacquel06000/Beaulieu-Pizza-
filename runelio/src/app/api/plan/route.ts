import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { handle } from "@/server/api";
import { getActivePlan } from "@/server/plans";
import { requireApiUser } from "@/server/session";

export const GET = handle(async () => {
  const u = await requireApiUser();
  return NextResponse.json({ plan: await getActivePlan(getDb(), u.id) }, { headers: { "Cache-Control": "no-store" } });
});
