import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { assertSameOrigin, handle } from "@/server/api";
import { validateGiveaway } from "@/server/giveaways";
import { requireApiAdmin } from "@/server/session";

const body = z.object({ legalReviewDone: z.boolean(), rulesPublished: z.boolean(), note: z.string().max(2000).default("") });

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/admin/giveaways/[id]/validate">) => {
  assertSameOrigin(req);
  const admin = await requireApiAdmin();
  const { id } = await ctx.params;
  await validateGiveaway(getDb(), id, admin.id, body.parse(await req.json()));
  return NextResponse.json({ ok: true });
});
