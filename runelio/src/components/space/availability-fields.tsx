"use client";

import { DAY_LABELS } from "@/domain/dates";
import { SLOT_LABELS } from "@/lib/labels";
import { cx, Field, inputClass } from "../ui";

export type Availability = {
  availableDays: number[];
  restDays: number[];
  timeSlots: Record<string, keyof typeof SLOT_LABELS>;
  longRunDay: number | null;
  maxSessionMinutes: number;
};

const DURATIONS = [30, 45, 60, 75, 90, 120, 150, 180, 210];

export function AvailabilityFields({ value, onChange, error }: { value: Availability; onChange: (v: Availability) => void; error?: string }) {
  const toggle = (list: number[], d: number) => (list.includes(d) ? list.filter((x) => x !== d) : [...list, d].sort());
  const usable = value.availableDays.filter((d) => !value.restDays.includes(d));
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-semibold">Jours où vous pouvez courir</legend>
        <p className="text-xs text-muted mt-1">Au moins deux jours. Le programme ne placera aucune séance ailleurs.</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DAY_LABELS.map((label, d) => {
            const on = value.availableDays.includes(d);
            const rest = value.restDays.includes(d);
            return (
              <div key={label} className={cx("rounded-xl p-3 ring-1 transition", on && !rest ? "bg-lime-soft ring-ink/15" : "bg-white ring-line")}>
                <label className="flex items-center gap-3 font-medium">
                  <input type="checkbox" className="size-5 accent-ink" checked={on} onChange={() => onChange({ ...value, availableDays: toggle(value.availableDays, d) })} />
                  {label}
                </label>
                {(
                  <label data-slot hidden={!(on && !rest)} className="mt-2 flex items-center gap-2 text-xs text-muted">
                    Créneau
                    <select
                      className="rounded-lg bg-white px-2 py-1 ring-1 ring-line text-ink"
                      value={value.timeSlots[String(d)] ?? "flexible"}
                      onChange={(e) => onChange({ ...value, timeSlots: { ...value.timeSlots, [String(d)]: e.target.value as keyof typeof SLOT_LABELS } })}
                    >
                      {Object.entries(SLOT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            );
          })}
        </div>
        {error && <p className="mt-2 text-xs font-medium text-danger" role="alert">{error}</p>}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">Jours de repos imposés <span className="font-normal text-muted">(facultatif)</span></legend>
        <p className="text-xs text-muted mt-1">Aucune séance ne sera jamais planifiée ces jours-là.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DAY_LABELS.map((label, d) => (
            <label key={label} className={cx("cursor-pointer rounded-full px-3 py-2 text-sm ring-1 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-sky", value.restDays.includes(d) ? "bg-ink text-white ring-ink" : "bg-white ring-line")}>
              <input type="checkbox" className="sr-only" checked={value.restDays.includes(d)} onChange={() => onChange({ ...value, restDays: toggle(value.restDays, d) })} />
              {label.slice(0, 3)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="longRunDay" label="Jour préféré pour la sortie longue" optional>
          <select id="longRunDay" className={inputClass} value={value.longRunDay ?? ""} onChange={(e) => onChange({ ...value, longRunDay: e.target.value === "" ? null : Number(e.target.value) })}>
            <option value="">Laisser Runelio choisir</option>
            {usable.map((d) => (
              <option key={d} value={d}>{DAY_LABELS[d]}</option>
            ))}
          </select>
        </Field>
        <Field id="maxSession" label="Durée maximale d'une séance">
          <select id="maxSession" className={inputClass} value={value.maxSessionMinutes} onChange={(e) => onChange({ ...value, maxSessionMinutes: Number(e.target.value) })}>
            {DURATIONS.map((m) => (
              <option key={m} value={m}>{m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60}` : ""}`}</option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}
