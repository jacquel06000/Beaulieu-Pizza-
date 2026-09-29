import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { assertSameOrigin, handle } from "@/server/api";
import { setSessionCompleted } from "@/server/plans";
import { requireApiUser } from "@/server/session";

const body = z.object({ completed: z.boolean() });

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/plan/sessions/[id]">) => {
  assertSameOrigin(req);
  const u = await requireApiUser();
  const { id } = await ctx.params;
  const { completed } = body.parse(await req.json());
  await setSessionCompleted(getDb(), u.id, id, completed);
  return NextResponse.json({ ok: true });
});
