import { addDays, mondayOf } from "@/domain/dates";

/** Jours libres de la même semaine où une séance peut être déplacée. */
export function movableDays(sessionDate: string, raceDate: string, occupied: Set<string>, today: string): string[] {
  const monday = mondayOf(sessionDate);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    if (d !== sessionDate && d >= today && d < raceDate && !occupied.has(d)) days.push(d);
  }
  return days;
}
