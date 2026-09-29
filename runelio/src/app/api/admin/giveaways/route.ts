import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { assertSameOrigin, handle } from "@/server/api";
import { createGiveaway, giveawayInputSchema, listGiveaways } from "@/server/giveaways";
import { requireApiAdmin } from "@/server/session";

export const GET = handle(async () => {
  await requireApiAdmin();
  return NextResponse.json({ giveaways: await listGiveaways(getDb()) });
});

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await requireApiAdmin();
  const g = await createGiveaway(getDb(), giveawayInputSchema.parse(await req.json()));
  return NextResponse.json({ giveaway: g });
});
