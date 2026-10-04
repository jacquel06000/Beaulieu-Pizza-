import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { assertSameOrigin, handle } from "@/server/api";
import { FEELINGS, moveSession, setFeeling } from "@/server/plan-tools";
import { setSessionCompleted } from "@/server/plans";
import { requireApiUser } from "@/server/session";

const body = z.union([
  z.object({ completed: z.boolean() }),
  z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
  z.object({ feeling: z.enum(FEELINGS).nullable() }),
]);

export const PATCH = handle(async (req: Request, ctx: RouteContext<"/api/plan/sessions/[id]">) => {
  assertSameOrigin(req);
  const u = await requireApiUser();
  const { id } = await ctx.params;
  const input = body.parse(await req.json());
  const db = getDb();
  if ("completed" in input) {
    await setSessionCompleted(db, u.id, id, input.completed);
    return NextResponse.json({ ok: true });
  }
  if ("date" in input) {
    return NextResponse.json({ ok: true, ...(await moveSession(db, u.id, id, input.date)) });
  }
  await setFeeling(db, u.id, id, input.feeling);
  return NextResponse.json({ ok: true });
});
