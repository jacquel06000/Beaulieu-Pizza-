import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { env } from "@/lib/env";
import { sendMail } from "@/server/mailer";
import { sendDueReminders } from "@/server/reminders";

/** Appelé toutes les heures par la tâche planifiée (service `cron` de docker compose). */
export async function POST(req: Request) {
  const secret = env().CRON_SECRET;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  const ok = secret && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await sendDueReminders(getDb(), sendMail, env().NEXT_PUBLIC_APP_URL);
  return NextResponse.json(result);
}
