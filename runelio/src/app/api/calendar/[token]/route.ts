import { getDb } from "@/db";
import { env } from "@/lib/env";
import { calendarForToken } from "@/server/calendar";
import { enforceRateLimit } from "@/server/rate-limit";

/** Flux iCalendar privé (Google Agenda, Apple Calendrier, Outlook). */
export async function GET(_req: Request, ctx: RouteContext<"/api/calendar/[token]">) {
  const { token } = await ctx.params;
  const clean = token.replace(/\.ics$/, "");
  const db = getDb();
  try {
    await enforceRateLimit(db, `ics:${clean.slice(0, 32)}`, 120, 3600);
  } catch {
    return new Response("Trop de requêtes", { status: 429 });
  }
  const ics = await calendarForToken(db, clean, env().NEXT_PUBLIC_APP_URL);
  if (!ics) return new Response("Introuvable", { status: 404 });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="runelio.ics"',
      "Cache-Control": "private, max-age=900",
      "X-Robots-Tag": "noindex",
    },
  });
}
