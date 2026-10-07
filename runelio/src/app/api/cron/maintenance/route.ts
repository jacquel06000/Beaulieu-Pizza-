import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { env } from "@/lib/env";
import { sendMail } from "@/server/mailer";
import { parisHour } from "@/server/reminders";
import { sendRenewalReminders } from "@/server/renewal";
import { clearStaleWarnings, runRetention } from "@/server/retention";

/** Maintenance quotidienne (durées de conservation, rappels de renouvellement). Exécutée à 3 h, heure de Paris. */
export async function POST(req: Request) {
  const secret = env().CRON_SECRET;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  const ok = secret && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const force = new URL(req.url).searchParams.get("force") === "1";
  if (!force && parisHour(new Date()) !== 3) return NextResponse.json({ skipped: "not_3am" });
  const db = getDb();
  await clearStaleWarnings(db);
  const appUrl = env().NEXT_PUBLIC_APP_URL;
  const renewal = await sendRenewalReminders(db, sendMail, appUrl);
  return NextResponse.json({ ...(await runRetention(db, sendMail, appUrl)), renewalReminders: renewal.sent });
}
