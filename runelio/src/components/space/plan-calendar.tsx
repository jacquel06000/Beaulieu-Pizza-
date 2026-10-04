"use client";

import { useMemo, useState } from "react";
import { addDays, DAY_SHORT, dayOfWeek, formatDateFr } from "@/domain/dates";
import { PHASE_LABELS, SESSION_STYLE } from "@/lib/labels";
import { Badge, cx } from "../ui";

export type CalSession = {
  id: string;
  weekIndex: number;
  date: string;
  type: string;
  title: string;
  durationMin: number;
  distanceKm: number | null;
  intensity: { rpe: string; label: string; talk: string; pace?: string };
  instructions: string;
  structure: string[];
  completedAt: string | null;
};
export type CalWeek = { weekIndex: number; startDate: string; phase: string; focus: string; targetVolumeKm: number };

export function PlanCalendar({ weeks, sessions: initial, today, readOnly }: { weeks: CalWeek[]; sessions: CalSession[]; today: string; readOnly: boolean }) {
  const [sessions, setSessions] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const done = sessions.filter((s) => s.completedAt).length;
  const pastOrToday = sessions.filter((s) => s.date <= today && s.type !== "race").length;
  const currentIdx = useMemo(() => {
    const w = weeks.find((w) => today >= w.startDate && today <= addDays(w.startDate, 6));
    return w?.weekIndex ?? weeks[0]?.weekIndex ?? 0;
  }, [weeks, today]);

  async function toggle(s: CalSession) {
    const completed = !s.completedAt;
    setSessions((all) => all.map((x) => (x.id === s.id ? { ...x, completedAt: completed ? new Date().toISOString() : null } : x)));
    const res = await fetch(`/api/plan/sessions/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed }) });
    if (!res.ok) {
      setSessions((all) => all.map((x) => (x.id === s.id ? s : x)));
      setError("La mise à jour n'a pas pu être enregistrée.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Séances réalisées</span>
          <span className="text-muted">{done} / {sessions.length}{pastOrToday ? ` · ${Math.round((done / Math.max(1, pastOrToday)) * 100)} % des séances passées` : ""}</span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ink/5" role="progressbar" aria-valuemin={0} aria-valuemax={sessions.length} aria-valuenow={done} aria-label="Séances réalisées">
          <div className="h-full rounded-full bg-gradient-to-r from-brand to-lime transition-all duration-500" style={{ width: `${(done / Math.max(1, sessions.length)) * 100}%` }} />
        </div>
      </div>
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}

      {weeks.map((w) => {
        const ws = sessions.filter((s) => s.weekIndex === w.weekIndex);
        const isCurrent = w.weekIndex === currentIdx;
        const minutes = ws.reduce((a, s) => a + s.durationMin, 0);
        return (
          <section key={w.weekIndex} id={`semaine-${w.weekIndex + 1}`} aria-labelledby={`w-${w.weekIndex}`} className={cx("scroll-mt-24 rounded-2xl p-4 sm:p-5 ring-1", isCurrent ? "bg-white ring-2 ring-ink shadow-md" : "bg-white/70 ring-line")}>
            <header className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 id={`w-${w.weekIndex}`} className="text-lg font-bold">
                  Semaine {w.weekIndex + 1} <span className="font-normal text-muted text-sm">· du {formatDateFr(w.startDate, { day: "numeric", month: "short" })}</span>
                </h2>
                <p className="text-sm text-muted">{w.focus}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {isCurrent && <Badge tone="lime">Cette semaine</Badge>}
                <Badge tone="violet">{PHASE_LABELS[w.phase] ?? w.phase}</Badge>
                <Badge>{w.targetVolumeKm > 0 ? `≈ ${w.targetVolumeKm} km` : ""}{w.targetVolumeKm > 0 ? " · " : ""}{Math.floor(minutes / 60)} h {String(minutes % 60).padStart(2, "0")}</Badge>
              </div>
            </header>

            {/* Bande des 7 jours (repère visuel) */}
            <div className="mt-4 grid grid-cols-7 gap-1.5" aria-hidden>
              {DAY_SHORT.map((d, i) => {
                const s = ws.find((x) => dayOfWeek(x.date) === i);
                return (
                  <div key={d} className={cx("rounded-lg py-2 text-center text-[11px] font-semibold", s ? SESSION_STYLE[s.type]?.className : "bg-ink/[0.03] text-muted", s?.completedAt && "opacity-60")}>
                    {d}
                    <span className="block text-[10px] font-medium">{s ? (s.completedAt ? "✓" : `${s.durationMin}′`) : "repos"}</span>
                  </div>
                );
              })}
            </div>

            <ul className="mt-4 space-y-2">
              {ws.map((s) => {
                const expanded = open === s.id;
                const style = SESSION_STYLE[s.type];
                return (
                  <li key={s.id} className={cx("rounded-xl ring-1 ring-line bg-paper/60", s.date === today && "ring-2 ring-brand")}>
                    <div className="flex items-center gap-3 p-3">
                      {!readOnly && s.type !== "race" ? (
                        <button
                          type="button"
                          onClick={() => toggle(s)}
                          aria-pressed={Boolean(s.completedAt)}
                          aria-label={`${s.completedAt ? "Marquer comme non réalisée" : "Marquer comme réalisée"} : ${s.title} du ${formatDateFr(s.date)}`}
                          className={cx("flex size-9 shrink-0 items-center justify-center rounded-full ring-2 transition", s.completedAt ? "bg-lime ring-lime text-ink" : "ring-line bg-white hover:ring-ink/40")}
                        >
                          {s.completedAt ? "✓" : ""}
                        </button>
                      ) : (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-lime font-bold" aria-hidden>{s.type === "race" ? "★" : ""}</span>
                      )}
                      <button type="button" className="flex-1 text-left" aria-expanded={expanded} aria-controls={`d-${s.id}`} onClick={() => setOpen(expanded ? null : s.id)}>
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-muted">{formatDateFr(s.date, { weekday: "short", day: "numeric", month: "short" })}</span>
                          <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-bold", style?.className)}>{style?.label}</span>
                        </span>
                        <span className={cx("block font-semibold", s.completedAt && "line-through decoration-2 decoration-ink/30")}>{s.title}</span>
                        <span className="block text-sm text-muted">
                          {s.durationMin} min{s.distanceKm ? ` · ≈ ${s.distanceKm} km` : ""} · {s.intensity.label} ({s.intensity.rpe})
                        </span>
                      </button>
                      <span aria-hidden className={cx("text-muted transition", expanded && "rotate-180")}>▾</span>
                    </div>
                    {/* Toujours présent dans le DOM (aria-controls valide), masqué quand replié. */}
                    {(
                      <div id={`d-${s.id}`} hidden={!expanded} className="border-t border-line px-4 py-4 text-sm animate-rise">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-lg bg-white p-3 ring-1 ring-line">
                            <p className="text-xs font-semibold text-muted">Effort</p>
                            <p className="font-semibold">{s.intensity.rpe}</p>
                          </div>
                          <div className="rounded-lg bg-white p-3 ring-1 ring-line">
                            <p className="text-xs font-semibold text-muted">Test de la parole</p>
                            <p>{s.intensity.talk}</p>
                          </div>
                          <div className="rounded-lg bg-white p-3 ring-1 ring-line">
                            <p className="text-xs font-semibold text-muted">Allure indicative</p>
                            <p>{s.intensity.pace ?? "Au ressenti"}</p>
                          </div>
                        </div>
                        {s.structure.length > 0 && (
                          <ol className="mt-4 space-y-1.5 list-decimal pl-5">
                            {s.structure.map((l) => (
                              <li key={l}>{l}</li>
                            ))}
                          </ol>
                        )}
                        <p className="mt-3 leading-relaxed text-ink-soft">{s.instructions}</p>
                      </div>
                    )}
                  </li>
                );
              })}
              {ws.length === 0 && <li className="text-sm text-muted">Semaine sans séance.</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
