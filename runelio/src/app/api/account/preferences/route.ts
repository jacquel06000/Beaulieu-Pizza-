import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { assertSameOrigin, handle } from "@/server/api";
import { getReminderPreference, setReminderPreference } from "@/server/reminders";
import { requireApiUser } from "@/server/session";

export const GET = handle(async () => {
  const u = await requireApiUser();
  return NextResponse.json({ reminderEmail: await getReminderPreference(getDb(), u.id) });
});

export const PUT = handle(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireApiUser();
  const { reminderEmail } = z.object({ reminderEmail: z.boolean() }).parse(await req.json());
  await setReminderPreference(getDb(), u.id, reminderEmail);
  return NextResponse.json({ ok: true });
});
