import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { assertSameOrigin, handle } from "@/server/api";
import { undoCancellation } from "@/server/billing";
import { requireApiUser } from "@/server/session";
import { stripeGateway } from "@/server/stripe";

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireApiUser();
  await undoCancellation(getDb(), stripeGateway, u.id);
  return NextResponse.json({ ok: true });
});
