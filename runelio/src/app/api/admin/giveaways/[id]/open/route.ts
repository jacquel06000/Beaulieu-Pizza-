import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { env } from "@/lib/env";
import { assertSameOrigin, handle } from "@/server/api";
import { openGiveaway } from "@/server/giveaways";
import { requireApiAdmin } from "@/server/session";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/admin/giveaways/[id]/open">) => {
  assertSameOrigin(req);
  await requireApiAdmin();
  const { id } = await ctx.params;
  await openGiveaway(getDb(), id, env().GIVEAWAYS_ENABLED);
  return NextResponse.json({ ok: true });
});
