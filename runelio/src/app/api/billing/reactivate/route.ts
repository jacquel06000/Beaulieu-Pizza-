import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { assertSameOrigin, handle } from "@/server/api";
import { undoCancellation } from "@/server/billing";
import { requireApiUser } from "@/server/session";
import { whopGateway } from "@/server/whop";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireApiUser();
  await undoCancellation(getDb(), whopGateway, u.id);
  return NextResponse.json({ ok: true });
});
