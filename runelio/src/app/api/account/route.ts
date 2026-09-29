import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { user } from "@/db/schema";
import { phoneSchema } from "@/lib/validation";
import { assertSameOrigin, handle } from "@/server/api";
import { requireApiUser } from "@/server/session";

const body = z.object({ name: z.string().trim().min(1).max(80), phone: phoneSchema });

export const PATCH = handle(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireApiUser();
  const { name, phone } = body.parse(await req.json());
  await getDb().update(user).set({ name, phone: phone || null }).where(eq(user.id, u.id));
  return NextResponse.json({ ok: true });
});
