import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { env } from "@/lib/env";
import { assertSameOrigin, handle } from "@/server/api";
import { getOrCreateCalendarToken } from "@/server/calendar";
import { requireApiUser } from "@/server/session";

function urls(token: string) {
  const base = env().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const https = `${base}/api/calendar/${token}`;
  return { url: https, webcal: https.replace(/^https?:/, "webcal:") };
}

/** Lien d'abonnement agenda (créé à la première demande). */
export const GET = handle(async () => {
  const u = await requireApiUser();
  return NextResponse.json(urls(await getOrCreateCalendarToken(getDb(), u.id)), { headers: { "Cache-Control": "no-store" } });
});

/** Renouvelle le lien : l'ancien cesse immédiatement de fonctionner. */
export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  const u = await requireApiUser();
  return NextResponse.json(urls(await getOrCreateCalendarToken(getDb(), u.id, true)));
});
