export const LEVEL_LABELS = { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé" } as const;
export const LEVEL_HINTS = {
  beginner: "Vous courez peu ou pas régulièrement, ou vous préparez votre première course.",
  intermediate: "Vous courez régulièrement et avez déjà couru quelques courses.",
  advanced: "Vous vous entraînez de façon structurée plusieurs fois par semaine.",
} as const;
export const EXPERIENCE_LABELS = {
  none: "Je ne cours pas encore régulièrement",
  lt6m: "Moins de 6 mois de pratique régulière",
  "6to24m": "Entre 6 mois et 2 ans",
  gt2y: "Plus de 2 ans",
} as const;
export const SLOT_LABELS = { flexible: "Indifférent", morning: "Matin", midday: "Midi", evening: "Soir" } as const;

export function formatHms(totalSec: number | null | undefined): string {
  if (!totalSec) return "—";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h ? `${h} h ${String(m).padStart(2, "0")}${s ? ` min ${String(s).padStart(2, "0")} s` : ""}` : `${m} min${s ? ` ${String(s).padStart(2, "0")} s` : ""}`;
}

export function hmsToSeconds(h: string, m: string, s: string): number | null {
  const total = (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
  return total > 0 ? total : null;
}

export const SESSION_STYLE: Record<string, { label: string; className: string }> = {
  easy: { label: "Endurance", className: "bg-mint-soft text-mint" },
  recovery: { label: "Récupération", className: "bg-mint-soft text-mint" },
  run_walk: { label: "Course / marche", className: "bg-mint-soft text-mint" },
  long: { label: "Sortie longue", className: "bg-sky-soft text-[#1d4ed8]" },
  fartlek: { label: "Qualité", className: "bg-violet-soft text-violet" },
  hills: { label: "Qualité", className: "bg-violet-soft text-violet" },
  tempo: { label: "Qualité", className: "bg-brand-soft text-brand-strong" },
  intervals: { label: "Qualité", className: "bg-brand-soft text-brand-strong" },
  race_pace: { label: "Spécifique", className: "bg-brand-soft text-brand-strong" },
  shakeout: { label: "Déblocage", className: "bg-mint-soft text-mint" },
  race: { label: "Jour J", className: "bg-lime text-ink" },
};

export const PHASE_LABELS: Record<string, string> = {
  base: "Fondation",
  build: "Développement",
  specific: "Spécifique",
  taper: "Affûtage",
  race: "Course",
};
