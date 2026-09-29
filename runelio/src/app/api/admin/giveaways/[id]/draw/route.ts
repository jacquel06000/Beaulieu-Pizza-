import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { env } from "@/lib/env";
import { assertSameOrigin, handle } from "@/server/api";
import { drawGiveaway } from "@/server/giveaways";
import { requireApiAdmin } from "@/server/session";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/admin/giveaways/[id]/draw">) => {
  assertSameOrigin(req);
  await requireApiAdmin();
  const { id } = await ctx.params;
  return NextResponse.json(await drawGiveaway(getDb(), id, env().GIVEAWAYS_ENABLED));
});
