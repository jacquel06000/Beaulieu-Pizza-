"use client";

import { useState } from "react";
import { formatDateFr } from "@/domain/dates";
import { movableDays } from "@/lib/plan-days";
import { cx, inputClass } from "../ui";
import type { CalSession } from "./plan-calendar";

const FEELINGS = [
  { id: "easy", label: "Facile" },
  { id: "ok", label: "Correct" },
  { id: "hard", label: "Difficile" },
  { id: "too_hard", label: "Trop difficile" },
] as const;

/** Ressenti et déplacement d'une séance, dans le détail du calendrier. */
export function SessionTools({
  session: s,
  today,
  raceDate,
  canEdit,
  occupied,
  onChange,
}: {
  session: CalSession;
  today: string;
  raceDate: string;
  canEdit: boolean;
  occupied: Set<string>;
  onChange: (patch: Partial<CalSession>) => void;
}) {
  const [msg, setMsg] = useState<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);
  const [target, setTarget] = useState("");
  const isRace = s.type === "race";
  const days = movableDays(s.date, raceDate, occupied, today);

  async function patch(body: object) {
    const res = await fetch(`/api/plan/sessions/${s.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg({ tone: "error", text: j.message ?? "Modification impossible." });
      return null;
    }
    return j;
  }

  async function chooseFeeling(id: string) {
    const next = s.feeling === id ? null : id;
    const prev = { feeling: s.feeling, completedAt: s.completedAt };
    onChange({ feeling: next, completedAt: next ? (s.completedAt ?? new Date().toISOString()) : s.completedAt });
    if (!(await patch({ feeling: next }))) onChange(prev);
    else setMsg(next ? { tone: "ok", text: "Ressenti enregistré. Il sera pris en compte au prochain réajustement." } : null);
  }

  async function move() {
    if (!target) return;
    const j = await patch({ date: target });
    if (!j) return;
    onChange({ date: j.date, originalDate: s.originalDate ?? s.date });
    setTarget("");
    setMsg(j.warning ? { tone: "warn", text: j.warning } : { tone: "ok", text: `Séance déplacée au ${formatDateFr(j.date)}.` });
  }

  if (isRace) return null;
  return (
    <div className="mt-5 space-y-4 border-t border-line pt-4">
      {s.date <= today && (
        <fieldset>
          <legend className="text-xs font-semibold text-muted">Comment s&apos;est passée la séance ?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {FEELINGS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={s.feeling === f.id}
                onClick={() => chooseFeeling(f.id)}
                className={cx("rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition", s.feeling === f.id ? "bg-ink text-white ring-ink" : "bg-white ring-line hover:ring-ink/30")}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted leading-relaxed">
            Douleur ou gêne ? Arrêtez-vous, ne forcez pas et demandez l&apos;avis d&apos;un professionnel de santé. Runelio n&apos;enregistre aucune information médicale.
          </p>
        </fieldset>
      )}

      {canEdit && !s.completedAt && s.date >= today && (
        <div>
          <label htmlFor={`move-${s.id}`} className="text-xs font-semibold text-muted">
            Pas disponible ce jour-là ? Déplacer dans la semaine
          </label>
          {days.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <select id={`move-${s.id}`} className={cx(inputClass, "w-auto min-w-48")} value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">Choisir un jour</option>
                {days.map((d) => (
                  <option key={d} value={d}>{formatDateFr(d)}</option>
                ))}
              </select>
              <button type="button" onClick={move} disabled={!target} className="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-50">
                Déplacer
              </button>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted">Aucun jour libre cette semaine. Pour changer vos jours habituels, modifiez vos disponibilités.</p>
          )}
        </div>
      )}

      {msg && (
        <p role="status" className={cx("text-sm font-medium", msg.tone === "error" ? "text-danger" : msg.tone === "warn" ? "text-warn" : "text-mint")}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
