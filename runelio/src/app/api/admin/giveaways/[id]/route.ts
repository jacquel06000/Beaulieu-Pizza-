import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { assertSameOrigin, handle } from "@/server/api";
import { giveawayInputSchema, updateGiveaway } from "@/server/giveaways";
import { requireApiAdmin } from "@/server/session";

export const PUT = handle(async (req: Request, ctx: RouteContext<"/api/admin/giveaways/[id]">) => {
  assertSameOrigin(req);
  await requireApiAdmin();
  const { id } = await ctx.params;
  await updateGiveaway(getDb(), id, giveawayInputSchema.parse(await req.json()));
  return NextResponse.json({ ok: true });
});
