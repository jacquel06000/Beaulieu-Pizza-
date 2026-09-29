"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { availableGoals } from "@/domain/sports";
import { EXPERIENCE_LABELS, LEVEL_HINTS, LEVEL_LABELS } from "@/lib/labels";
import { Alert, Button, cx, Field, inputClass } from "../ui";
import { AvailabilityFields, type Availability } from "./availability-fields";

type Goal = "5k" | "10k" | "half" | "marathon";
type Level = keyof typeof LEVEL_LABELS;
type Experience = keyof typeof EXPERIENCE_LABELS;

export type QuestionnaireInitial = {
  goal: Goal;
  raceDate: string | null;
  horizonWeeks: number | null;
  targetTimeSec: number | null;
  level: Level;
  experience: Experience;
  runsPerWeek: number;
  weeklyVolumeKm: number;
  longestRunKm: number;
  refDistanceKm: number | null;
  refTimeSec: number | null;
} & Availability;

const split = (sec: number | null) =>
  sec ? { h: String(Math.floor(sec / 3600)), m: String(Math.floor((sec % 3600) / 60)), s: String(sec % 60) } : { h: "", m: "", s: "" };
const toSec = (t: { h: string; m: string; s: string }) => {
  const v = (Number(t.h) || 0) * 3600 + (Number(t.m) || 0) * 60 + (Number(t.s) || 0);
  return v > 0 ? v : null;
};

const STEPS = ["Objectif", "Niveau", "Références", "Disponibilités"] as const;
const REF_DISTANCES = [
  { v: 5, l: "5 km" },
  { v: 10, l: "10 km" },
  { v: 21.1, l: "Semi-marathon" },
  { v: 42.2, l: "Marathon" },
];

function TimeInput({ id, value, onChange, label }: { id: string; value: { h: string; m: string; s: string }; onChange: (v: { h: string; m: string; s: string }) => void; label: string }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      {(["h", "m", "s"] as const).map((k) => (
        <label key={k} className="flex items-center gap-1">
          <input
            id={k === "h" ? id : undefined}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            className={cx(inputClass, "w-16 text-center")}
            value={value[k]}
            aria-label={{ h: "heures", m: "minutes", s: "secondes" }[k]}
            onChange={(e) => onChange({ ...value, [k]: e.target.value.replace(/\D/g, "").slice(0, 2) })}
          />
          <span className="text-sm text-muted">{k === "h" ? "h" : k === "m" ? "min" : "s"}</span>
        </label>
      ))}
    </div>
  );
}

export function Questionnaire({ initial, minDate }: { initial: QuestionnaireInitial | null; minDate: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});

  const [goal, setGoal] = useState<Goal>(initial?.goal ?? "10k");
  const [dateMode, setDateMode] = useState<"date" | "horizon">(initial?.horizonWeeks ? "horizon" : "date");
  const [raceDate, setRaceDate] = useState(initial?.raceDate ?? "");
  const [horizon, setHorizon] = useState(String(initial?.horizonWeeks ?? 12));
  const [target, setTarget] = useState(split(initial?.targetTimeSec ?? null));
  const [level, setLevel] = useState<Level>(initial?.level ?? "beginner");
  const [experience, setExperience] = useState<Experience>(initial?.experience ?? "lt6m");
  const [runsPerWeek, setRunsPerWeek] = useState(String(initial?.runsPerWeek ?? 2));
  const [volume, setVolume] = useState(String(initial?.weeklyVolumeKm ?? 10));
  const [longest, setLongest] = useState(String(initial?.longestRunKm ?? 5));
  const [hasRef, setHasRef] = useState(Boolean(initial?.refDistanceKm));
  const [refDist, setRefDist] = useState(String(initial?.refDistanceKm ?? 10));
  const [refTime, setRefTime] = useState(split(initial?.refTimeSec ?? null));
  const [avail, setAvail] = useState<Availability>({
    availableDays: initial?.availableDays ?? [1, 3, 6],
    restDays: initial?.restDays ?? [],
    timeSlots: initial?.timeSlots ?? {},
    longRunDay: initial?.longRunDay ?? null,
    maxSessionMinutes: initial?.maxSessionMinutes ?? 60,
  });

  function validate(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (dateMode === "date" && !raceDate) e.raceDate = "Indiquez la date de votre course.";
      if (dateMode === "date" && raceDate && raceDate < minDate) e.raceDate = "La date doit être dans le futur.";
      if (dateMode === "horizon" && !(Number(horizon) >= 2 && Number(horizon) <= 52)) e.horizon = "Entre 2 et 52 semaines.";
      const t = toSec(target);
      if (t !== null && t < 600) e.target = "Durée trop courte.";
    }
    if (s === 1) {
      if (!(Number(runsPerWeek) >= 0 && Number(runsPerWeek) <= 14)) e.runs = "Entre 0 et 14.";
      if (!(Number(volume) >= 0 && Number(volume) <= 250)) e.volume = "Entre 0 et 250 km.";
      if (!(Number(longest) >= 0 && Number(longest) <= 100)) e.longest = "Entre 0 et 100 km.";
    }
    if (s === 2 && hasRef && !toSec(refTime)) e.refTime = "Indiquez le temps réalisé, ou décochez l'option.";
    if (s === 3 && avail.availableDays.filter((d) => !avail.restDays.includes(d)).length < 2) {
      e.days = "Choisissez au moins deux jours disponibles qui ne sont pas des jours de repos.";
    }
    setFieldErr(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate(3)) return;
    setSaving(true);
    setError(null);
    const body = {
      goal,
      raceDate: dateMode === "date" ? raceDate : null,
      horizonWeeks: dateMode === "horizon" ? Number(horizon) : null,
      targetTimeSec: toSec(target),
      level,
      experience,
      runsPerWeek: Number(runsPerWeek),
      weeklyVolumeKm: Number(volume),
      longestRunKm: Number(longest),
      refDistanceKm: hasRef ? Number(refDist) : null,
      refTimeSec: hasRef ? toSec(refTime) : null,
      ...avail,
      longRunDay: avail.longRunDay != null && !avail.restDays.includes(avail.longRunDay) && avail.availableDays.includes(avail.longRunDay) ? avail.longRunDay : null,
    };
    const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.message ?? "Enregistrement impossible.");
      return;
    }
    router.push("/espace/recapitulatif");
    router.refresh();
  }

  const next = () => validate(step) && setStep(step + 1);

  return (
    <div>
      <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Étapes du questionnaire">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined}>
            <div className={cx("h-1.5 rounded-full transition-colors", i <= step ? "bg-brand" : "bg-line")} />
            <span className={cx("mt-2 block text-xs font-semibold", i === step ? "text-ink" : "text-muted")}>{s}</span>
          </li>
        ))}
      </ol>

      {error && <Alert tone="critical" className="mb-6">{error}</Alert>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 3) next();
          else submit();
        }}
        className="space-y-6"
        noValidate
      >
        {step === 0 && (
          <>
            <fieldset>
              <legend className="text-sm font-semibold">Votre objectif</legend>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {availableGoals().map((g) => (
                  <label key={g.id} className={cx("cursor-pointer rounded-2xl p-4 ring-1 transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-sky", goal === g.id ? "bg-ink text-white ring-ink" : "bg-white ring-line hover:ring-ink/30")}>
                    <input type="radio" name="goal" value={g.id} checked={goal === g.id} onChange={() => setGoal(g.id as Goal)} className="sr-only" />
                    <span className="block font-display text-xl font-bold">{g.shortLabel}</span>
                    <span className={cx("text-xs", goal === g.id ? "text-white/70" : "text-muted")}>{g.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold">Échéance</legend>
              <div className="mt-3 inline-flex rounded-full bg-white p-1 ring-1 ring-line">
                {(["date", "horizon"] as const).map((m) => (
                  <label key={m} className={cx("cursor-pointer rounded-full px-4 py-2 text-sm font-medium has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-sky", dateMode === m ? "bg-ink text-white" : "")}>
                    <input type="radio" name="dateMode" className="sr-only" checked={dateMode === m} onChange={() => setDateMode(m)} />
                    {m === "date" ? "J'ai une date de course" : "Pas encore de date"}
                  </label>
                ))}
              </div>
              <div className="mt-4 max-w-xs">
                {dateMode === "date" ? (
                  <Field id="raceDate" label="Date de la course" error={fieldErr.raceDate}>
                    <input id="raceDate" type="date" min={minDate} className={inputClass} value={raceDate} onChange={(e) => setRaceDate(e.target.value)} aria-invalid={!!fieldErr.raceDate} />
                  </Field>
                ) : (
                  <Field id="horizon" label="Horizon de préparation (semaines)" error={fieldErr.horizon}>
                    <input id="horizon" type="number" min={2} max={52} inputMode="numeric" className={inputClass} value={horizon} onChange={(e) => setHorizon(e.target.value)} />
                  </Field>
                )}
              </div>
            </fieldset>
            <Field id="target" label="Objectif chronométrique" optional hint="Par exemple : terminer un 10 km en moins de 50 minutes. Laissez vide pour viser simplement l'arrivée." error={fieldErr.target}>
              <TimeInput id="target" label="Objectif chronométrique" value={target} onChange={setTarget} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <fieldset>
              <legend className="text-sm font-semibold">Votre niveau</legend>
              <div className="mt-3 space-y-2">
                {(Object.keys(LEVEL_LABELS) as Level[]).map((l) => (
                  <label key={l} className={cx("flex cursor-pointer gap-3 rounded-2xl p-4 ring-1", level === l ? "bg-lime-soft ring-ink/20" : "bg-white ring-line")}>
                    <input type="radio" name="level" checked={level === l} onChange={() => setLevel(l)} className="mt-1 size-4 accent-ink" />
                    <span>
                      <span className="block font-semibold">{LEVEL_LABELS[l]}</span>
                      <span className="block text-sm text-muted">{LEVEL_HINTS[l]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Field id="experience" label="Expérience récente">
              <select id="experience" className={inputClass} value={experience} onChange={(e) => setExperience(e.target.value as Experience)}>
                {Object.entries(EXPERIENCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field id="runs" label="Sorties par semaine" hint="Moyenne des 4 dernières semaines." error={fieldErr.runs}>
                <input id="runs" type="number" min={0} max={14} inputMode="numeric" className={inputClass} value={runsPerWeek} onChange={(e) => setRunsPerWeek(e.target.value)} />
              </Field>
              <Field id="volume" label="Kilomètres par semaine" hint="Estimation, 0 si vous débutez." error={fieldErr.volume}>
                <input id="volume" type="number" min={0} max={250} step={1} inputMode="decimal" className={inputClass} value={volume} onChange={(e) => setVolume(e.target.value)} />
              </Field>
              <Field id="longest" label="Plus longue sortie récente (km)" error={fieldErr.longest}>
                <input id="longest" type="number" min={0} max={100} step={0.5} inputMode="decimal" className={inputClass} value={longest} onChange={(e) => setLongest(e.target.value)} />
              </Field>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-muted leading-relaxed">
              Un résultat récent (moins de 6 mois) permet d&apos;estimer vos allures d&apos;entraînement. Sans résultat, les intensités sont exprimées en effort perçu.
            </p>
            <label className="flex items-center gap-3 font-medium">
              <input type="checkbox" className="size-5 accent-ink" checked={hasRef} onChange={(e) => setHasRef(e.target.checked)} />
              Je connais un résultat récent
            </label>
            {hasRef && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="refDist" label="Distance">
                  <select id="refDist" className={inputClass} value={refDist} onChange={(e) => setRefDist(e.target.value)}>
                    {REF_DISTANCES.map((d) => (
                      <option key={d.v} value={d.v}>{d.l}</option>
                    ))}
                  </select>
                </Field>
                <Field id="refTime" label="Temps réalisé" error={fieldErr.refTime}>
                  <TimeInput id="refTime" label="Temps réalisé" value={refTime} onChange={setRefTime} />
                </Field>
              </div>
            )}
            <Alert tone="info">
              Ne renseignez aucune information médicale : Runelio n&apos;en a pas besoin. En cas de douleur, de blessure récente ou de doute sur votre santé, demandez l&apos;avis d&apos;un professionnel de santé avant de commencer.
            </Alert>
          </>
        )}

        {step === 3 && <AvailabilityFields value={avail} onChange={setAvail} error={fieldErr.days} />}

        <div className="flex items-center justify-between gap-3 pt-2">
          {step > 0 ? (
            <Button type="button" variant="secondary" onClick={() => setStep(step - 1)}>Retour</Button>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={saving}>{step < 3 ? "Continuer" : saving ? "Enregistrement…" : "Voir le récapitulatif"}</Button>
        </div>
      </form>
    </div>
  );
}
