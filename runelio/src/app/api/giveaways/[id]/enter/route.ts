import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { env } from "@/lib/env";
import { assertSameOrigin, handle } from "@/server/api";
import { enterGiveaway } from "@/server/giveaways";
import { requireApiUser } from "@/server/session";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/giveaways/[id]/enter">) => {
  assertSameOrigin(req);
  const u = await requireApiUser();
  const { id } = await ctx.params;
  await enterGiveaway(getDb(), u.id, id, env().GIVEAWAYS_ENABLED);
  return NextResponse.json({ ok: true });
});
