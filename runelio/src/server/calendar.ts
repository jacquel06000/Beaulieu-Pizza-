/**
 * Agenda : export du programme au format iCalendar (RFC 5545), lisible par
 * Google Agenda, Apple Calendrier et Outlook. Abonnement via une URL privée
 * contenant un jeton secret (révocable).
 */
import { randomBytes } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { trainingPlan, trainingSession, userPreference } from "@/db/schema";
import { addDays } from "@/domain/dates";
import { GOALS } from "@/domain/sports";
import { canViewPlan } from "./access";
import { getCurrentSubscription } from "./billing";

type IcsSession = {
  id: string;
  date: string;
  title: string;
  durationMin: number;
  distanceKm: number | null;
  intensity: { rpe: string; label: string; talk: string; pace?: string };
  instructions: string;
  structure: string[];
};

export function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Replie les lignes à 75 octets (RFC 5545 §3.1), sans couper un caractère UTF-8. */
export function foldLine(line: string): string {
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = Buffer.byteLength(ch, "utf8");
    const limit = out.length === 0 ? 75 : 74; // les lignes de continuation commencent par un espace
    if (bytes + size > limit) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

const icsDate = (iso: string) => iso.replace(/-/g, "");
const icsStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function buildIcs(sessions: IcsSession[], opts: { calendarName: string; appUrl: string; now?: Date }): string {
  const stamp = icsStamp(opts.now ?? new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Runelio//Programme d'entrainement//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(opts.calendarName)}`,
    "X-WR-TIMEZONE:Europe/Paris",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ];
  for (const s of sessions) {
    const summary = `${s.title} · ${s.durationMin} min${s.distanceKm ? ` (≈ ${s.distanceKm} km)` : ""}`;
    const description = [
      `Intensité : ${s.intensity.label} (${s.intensity.rpe})`,
      s.intensity.pace ? `Allure indicative : ${s.intensity.pace}` : null,
      `Test de la parole : ${s.intensity.talk}`,
      "",
      ...s.structure.map((l) => `• ${l}`),
      "",
      s.instructions,
      "",
      `${opts.appUrl}/espace/programme`,
    ]
      .filter((l) => l !== null)
      .join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${s.id}@runelio.fr`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(s.date)}`,
      `DTEND;VALUE=DATE:${icsDate(addDays(s.date, 1))}`,
      `SUMMARY:${escapeIcs(summary)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

export function newCalendarToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Renvoie le jeton existant, ou en crée un (ou le renouvelle si `rotate`). */
export async function getOrCreateCalendarToken(db: Db, userId: string, rotate = false): Promise<string> {
  const [pref] = await db.select().from(userPreference).where(eq(userPreference.userId, userId));
  if (pref?.calendarToken && !rotate) return pref.calendarToken;
  const token = newCalendarToken();
  await db
    .insert(userPreference)
    .values({ userId, calendarToken: token })
    .onConflictDoUpdate({ target: userPreference.userId, set: { calendarToken: token, updatedAt: new Date() } });
  return token;
}

/** Calendrier lié à un jeton. `null` si le jeton est inconnu ou si l'abonnement n'est plus actif. */
export async function calendarForToken(db: Db, token: string, appUrl: string, now = new Date()): Promise<string | null> {
  if (!token || token.length < 20) return null;
  const [pref] = await db.select().from(userPreference).where(eq(userPreference.calendarToken, token));
  if (!pref) return null;
  const sub = await getCurrentSubscription(db, pref.userId);
  if (!canViewPlan(sub, now)) return buildIcs([], { calendarName: "Runelio", appUrl, now });
  const [plan] = await db
    .select()
    .from(trainingPlan)
    .where(and(eq(trainingPlan.userId, pref.userId), eq(trainingPlan.status, "active")));
  if (!plan) return buildIcs([], { calendarName: "Runelio", appUrl, now });
  const sessions = await db.select().from(trainingSession).where(eq(trainingSession.planId, plan.id)).orderBy(asc(trainingSession.date));
  return buildIcs(sessions, { calendarName: `Runelio — ${GOALS[plan.goal].label}`, appUrl, now });
}
