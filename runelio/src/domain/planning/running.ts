/**
 * Planificateur course à pied Runelio.
 *
 * Principes (règles d'entraînement générales, pas un avis médical) :
 * - progression du volume hebdomadaire limitée (~7–8 %/semaine) avec une
 *   semaine allégée toutes les 4 semaines ;
 * - une sortie longue par semaine, plafonnée selon l'objectif et le niveau ;
 * - séances de qualité espacées, jamais la veille ou le lendemain de la sortie
 *   longue quand les disponibilités le permettent ;
 * - affûtage avant la course, durée maximale de séance toujours respectée ;
 * - intensités exprimées en effort perçu (/10), test de la parole et, si un
 *   résultat de référence est fourni, allures estimées (formule de Riegel).
 */
import { GOALS, type RunningGoal } from "../sports";
import { addDays, dayOfWeek, diffDays, mondayOf } from "../dates";
import type {
  GeneratedPlan,
  Intensity,
  Level,
  Paces,
  Phase,
  PlanOptions,
  PlannedSession,
  PlannedWeek,
  RunningPlanInput,
  SessionType,
  Warning,
} from "./types";

export const GENERATOR_VERSION = "running-1.0.0";

export class PlanInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanInputError";
  }
}

type ByLevel<T> = Record<Level, T>;

/** Durée de préparation recommandée (semaines). */
export const RECOMMENDED_WEEKS: Record<RunningGoal, ByLevel<number>> = {
  "5k": { beginner: 8, intermediate: 6, advanced: 5 },
  "10k": { beginner: 10, intermediate: 8, advanced: 6 },
  half: { beginner: 14, intermediate: 10, advanced: 8 },
  marathon: { beginner: 20, intermediate: 16, advanced: 12 },
};
const PEAK_KM: Record<RunningGoal, ByLevel<number>> = {
  "5k": { beginner: 20, intermediate: 32, advanced: 45 },
  "10k": { beginner: 25, intermediate: 40, advanced: 55 },
  half: { beginner: 32, intermediate: 48, advanced: 65 },
  marathon: { beginner: 45, intermediate: 62, advanced: 85 },
};
const LONG_CAP_KM: Record<RunningGoal, ByLevel<number>> = {
  "5k": { beginner: 8, intermediate: 12, advanced: 15 },
  "10k": { beginner: 11, intermediate: 15, advanced: 18 },
  half: { beginner: 18, intermediate: 20, advanced: 24 },
  marathon: { beginner: 30, intermediate: 32, advanced: 34 },
};
/** Durée de sortie longue souhaitable en fin de préparation (minutes). */
const LONG_RUN_NEED_MIN: Record<RunningGoal, number> = { "5k": 40, "10k": 60, half: 100, marathon: 150 };
const DEFAULT_EASY_PACE: ByLevel<number> = { beginner: 420, intermediate: 360, advanced: 315 };
const MAX_RUNS: ByLevel<number> = { beginner: 3, intermediate: 5, advanced: 6 };
const TAPER_WEEKS: Record<RunningGoal, number> = { "5k": 1, "10k": 1, half: 2, marathon: 3 };
/** Coefficients de volume des semaines d'affûtage, de la plus ancienne à la semaine de course. */
const TAPER_FACTORS: Record<RunningGoal, number[]> = {
  "5k": [0.55],
  "10k": [0.55],
  half: [0.7, 0.5],
  marathon: [0.75, 0.6, 0.4],
};
/** Allure la plus rapide plausible (proche des records du monde), s/km. */
const WORLD_CLASS_PACE: Record<RunningGoal, number> = { "5k": 151, "10k": 158, half: 163, marathon: 172 };
/** En deçà de cette allure, l'objectif est ambitieux sans référence, s/km. */
const AMBITIOUS_PACE: Record<RunningGoal, ByLevel<number>> = {
  "5k": { beginner: 270, intermediate: 225, advanced: 0 },
  "10k": { beginner: 285, intermediate: 240, advanced: 0 },
  half: { beginner: 300, intermediate: 250, advanced: 0 },
  marathon: { beginner: 315, intermediate: 265, advanced: 0 },
};
/** Gain de performance réaliste par semaine d'entraînement. */
const GAIN_PER_WEEK: ByLevel<number> = { beginner: 0.008, intermediate: 0.005, advanced: 0.003 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));
const round05 = (km: number) => Math.round(km * 2) / 2;
const round5 = (min: number) => Math.max(5, Math.round(min / 5) * 5);

export function riegel(timeSec: number, fromKm: number, toKm: number): number {
  return timeSec * Math.pow(toKm / fromKm, 1.06);
}

export function formatPace(secPerKm: number): string {
  const s = Math.round(secPerKm);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatDuration(totalSec: number): string {
  const s = Math.round(totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min${sec ? ` ${String(sec).padStart(2, "0")} s` : ""}`;
}

function hasReference(input: RunningPlanInput): boolean {
  return Boolean(
    input.refDistanceKm && input.refTimeSec && input.refDistanceKm >= 1 && input.refDistanceKm <= 43 && input.refTimeSec > 0,
  );
}

export function computePaces(input: RunningPlanInput): Paces | null {
  if (!hasReference(input)) return null;
  const d = input.refDistanceKm!;
  const t = input.refTimeSec!;
  const goalKm = GOALS[input.goal].runDistanceKm;
  const p10 = riegel(t, d, 10) / 10;
  const predictedRace = riegel(t, d, goalKm) / goalKm;
  return {
    easyMin: p10 * 1.2,
    easyMax: p10 * 1.35,
    threshold: p10 * 1.04,
    interval: riegel(t, d, 5) / 5,
    marathon: riegel(t, d, 42.195) / 42.195,
    race: input.targetTimeSec ? input.targetTimeSec / goalKm : predictedRace,
  };
}

/** Jours de course utilisables : disponibles et non marqués comme repos. */
export function usableDays(input: Pick<RunningPlanInput, "availableDays" | "restDays">): number[] {
  const rest = new Set(input.restDays);
  return [...new Set(input.availableDays)].filter((d) => d >= 0 && d <= 6 && !rest.has(d)).sort((a, b) => a - b);
}

const circDist = (a: number, b: number) => Math.min(Math.abs(a - b), 7 - Math.abs(a - b));

/** Choisit `n` jours bien répartis, dont le jour de sortie longue. */
export function pickRunDays(days: number[], n: number, preferredLong?: number | null): { runDays: number[]; longDay: number } {
  const longDay =
    preferredLong != null && days.includes(preferredLong)
      ? preferredLong
      : days.includes(6)
        ? 6
        : days.includes(5)
          ? 5
          : days[days.length - 1];
  const chosen = [longDay];
  while (chosen.length < Math.min(n, days.length)) {
    let best = -1;
    let bestScore = -1;
    for (const d of days) {
      if (chosen.includes(d)) continue;
      const score = Math.min(...chosen.map((c) => circDist(c, d)));
      if (score > bestScore) {
        best = d;
        bestScore = score;
      }
    }
    chosen.push(best);
  }
  return { runDays: chosen.sort((a, b) => a - b), longDay };
}

/** Jours de qualité : non adjacents à la sortie longue ni entre eux si possible. */
export function pickQualityDays(runDays: number[], longDay: number, q: number): number[] {
  if (q <= 0) return [];
  const candidates = runDays.filter((d) => d !== longDay);
  const picked: number[] = [];
  const ok = (d: number, strict: boolean) =>
    (!strict || circDist(d, longDay) > 1) && picked.every((p) => circDist(p, d) > 1);
  for (const strict of [true, false]) {
    // Préférence : les jours les plus éloignés de la sortie longue d'abord.
    const sorted = [...candidates].sort((a, b) => circDist(b, longDay) - circDist(a, longDay) || a - b);
    for (const d of sorted) {
      if (picked.length >= q) break;
      if (!picked.includes(d) && ok(d, strict)) picked.push(d);
    }
    if (picked.length >= q) break;
  }
  return picked.sort((a, b) => a - b);
}

export function assessRealism(input: RunningPlanInput, weeks: number, paces: Paces | null): Warning[] {
  const w: Warning[] = [];
  const goalKm = GOALS[input.goal].runDistanceKm;
  const rec = RECOMMENDED_WEEKS[input.goal][input.level];
  const days = usableDays(input);

  if (weeks < Math.ceil(rec / 2)) {
    w.push({
      code: "timeline_too_short",
      severity: "critical",
      message: `Le délai (${weeks} semaine${weeks > 1 ? "s" : ""}) est manifestement trop court pour préparer sereinement cet objectif : nous recommandons au moins ${rec} semaines pour votre niveau. Le programme privilégie la prudence ; envisagez une course plus lointaine ou une distance plus courte.`,
    });
  } else if (weeks < rec) {
    w.push({
      code: "timeline_short",
      severity: "warning",
      message: `Le délai (${weeks} semaines) est inférieur aux ${rec} semaines recommandées pour votre niveau. La progression est volontairement limitée.`,
    });
  }

  if (input.goal === "marathon" && input.experience === "none") {
    w.push({
      code: "marathon_no_experience",
      severity: weeks < 24 ? "critical" : "warning",
      message:
        "Préparer un marathon sans pratique régulière de la course représente une charge très importante. Nous vous conseillons de viser d'abord un 10 km ou un semi-marathon, ou de prévoir une préparation longue.",
    });
  } else if (input.goal === "half" && input.experience === "none" && weeks < 16) {
    w.push({
      code: "half_no_experience",
      severity: "warning",
      message: "Sans pratique régulière, un semi-marathon demande en général une préparation d'au moins 16 semaines.",
    });
  }

  if (days.length === 2 && (input.goal === "half" || input.goal === "marathon")) {
    w.push({
      code: "few_days",
      severity: "warning",
      message: "Deux séances par semaine, c'est peu pour cette distance. Si possible, ajoutez un jour disponible.",
    });
  }

  const avgPace = paces ? (paces.easyMin + paces.easyMax) / 2 : DEFAULT_EASY_PACE[input.level];
  const needMin = Math.min(LONG_RUN_NEED_MIN[input.goal], (LONG_CAP_KM[input.goal][input.level] * avgPace) / 60);
  if (input.maxSessionMinutes < needMin * 0.8) {
    w.push({
      code: "session_too_short",
      severity: "warning",
      message: `Avec des séances de ${input.maxSessionMinutes} minutes au maximum, la sortie longue restera en deçà de ce qui est habituellement conseillé pour cette distance (environ ${Math.round(needMin)} minutes).`,
    });
  }

  if (input.targetTimeSec) {
    const targetPace = input.targetTimeSec / goalKm;
    if (targetPace < WORLD_CLASS_PACE[input.goal]) {
      w.push({
        code: "target_unrealistic",
        severity: "critical",
        message: `L'objectif de ${formatDuration(input.targetTimeSec)} correspond à une allure de ${formatPace(targetPace)} /km, plus rapide que les meilleures performances mondiales. Vérifiez la saisie.`,
      });
    } else if (hasReference(input)) {
      const predicted = riegel(input.refTimeSec!, input.refDistanceKm!, goalKm);
      const needed = (predicted - input.targetTimeSec) / predicted;
      const plausible = Math.min(0.15, weeks * GAIN_PER_WEEK[input.level]);
      if (needed > plausible * 1.5) {
        w.push({
          code: "target_unrealistic",
          severity: "critical",
          message: `Votre résultat de référence laisse estimer environ ${formatDuration(predicted)} aujourd'hui. Gagner ${Math.round(needed * 100)} % en ${weeks} semaines paraît manifestement irréaliste : un objectif proche de ${formatDuration(predicted * (1 - plausible))} serait plus prudent.`,
        });
      } else if (needed > plausible) {
        w.push({
          code: "target_ambitious",
          severity: "warning",
          message: `Objectif ambitieux : il suppose un gain d'environ ${Math.round(needed * 100)} % par rapport à votre niveau estimé (${formatDuration(predicted)}).`,
        });
      }
    } else if (targetPace < AMBITIOUS_PACE[input.goal][input.level]) {
      w.push({
        code: "target_ambitious_no_ref",
        severity: "warning",
        message: `Une allure de ${formatPace(targetPace)} /km est ambitieuse pour un niveau ${input.level === "beginner" ? "débutant" : "intermédiaire"}. Renseignez un résultat récent pour une estimation plus fiable.`,
      });
    }
  }
  return w;
}

function phaseOf(g: number, total: number, taper: number): Phase {
  if (g === total - 1) return "race";
  const build = total - taper;
  if (g >= build) return "taper";
  const base = Math.max(1, Math.ceil(build * 0.4));
  const specificStart = build - Math.max(1, Math.ceil(build * 0.3));
  if (g < base && build > 2) return "base";
  if (g >= specificStart) return "specific";
  return build <= 2 ? "specific" : "build";
}

const PHASE_FOCUS: Record<Phase, string> = {
  base: "Construire l'endurance fondamentale et la régularité",
  build: "Développer la vitesse et le seuil",
  specific: "Travailler l'allure de course",
  taper: "Affûtage : moins de volume, un peu d'intensité",
  race: "Semaine de course : fraîcheur et confiance",
};

function qualityCount(phase: Phase, level: Level, n: number): number {
  let q: number;
  if (phase === "base") q = level === "beginner" ? 0 : level === "advanced" && n >= 5 ? 2 : 1;
  else if (phase === "build" || phase === "specific") q = level === "beginner" ? 1 : level === "intermediate" && n < 4 ? 1 : 2;
  else q = 1;
  if (n === 2) return level !== "beginner" && (phase === "build" || phase === "specific") ? 1 : 0;
  return Math.min(q, n - 2);
}

function qualityType(phase: Phase, slot: number, goal: RunningGoal, level: Level, g: number): SessionType {
  const short = goal === "5k" || goal === "10k";
  if (phase === "base") return slot === 0 ? (g % 2 === 0 ? "fartlek" : "hills") : "hills";
  if (phase === "build") {
    if (level === "beginner") return g % 2 === 0 ? "fartlek" : "hills";
    if (slot === 0) return short ? "intervals" : "tempo";
    return goal === "marathon" ? "fartlek" : short ? "tempo" : "intervals";
  }
  if (phase === "specific") {
    if (level === "beginner") return short ? "race_pace" : "tempo";
    if (slot === 0) return "race_pace";
    return short ? "intervals" : "tempo";
  }
  return "race_pace";
}

function intensityFor(type: SessionType, paces: Paces | null, targetTimeSec?: number | null): Intensity {
  const range = (a: number, b: number) => `${formatPace(a)}–${formatPace(b)} /km`;
  switch (type) {
    case "easy":
    case "long":
    case "shakeout":
      return {
        rpe: "3–4/10",
        label: "Facile",
        talk: "Vous pouvez tenir une conversation complète.",
        pace: paces ? range(paces.easyMin, paces.easyMax) : undefined,
      };
    case "recovery":
    case "run_walk":
      return {
        rpe: "2–3/10",
        label: "Très facile",
        talk: "Respiration aisée, vous pourriez chanter.",
        pace: paces ? `≥ ${formatPace(paces.easyMax)} /km` : undefined,
      };
    case "fartlek":
      return { rpe: "4–7/10", label: "Variations d'allure", talk: "Phrases courtes pendant les accélérations." };
    case "hills":
      return { rpe: "7–8/10 en montée", label: "Dur en côte", talk: "Quelques mots seulement en montée." };
    case "tempo":
      return {
        rpe: "6–7/10",
        label: "Soutenu et contrôlé",
        talk: "Quelques mots à la fois, pas de phrase complète.",
        pace: paces ? range(paces.threshold - 5, paces.threshold + 5) : undefined,
      };
    case "intervals":
      return {
        rpe: "8/10",
        label: "Difficile",
        talk: "Parler est très difficile pendant les répétitions.",
        pace: paces ? range(paces.interval - 5, paces.interval + 5) : undefined,
      };
    case "race_pace":
      return {
        rpe: "6–8/10 selon la distance",
        label: "Allure de course",
        talk: "Effort que vous pensez tenir le jour J.",
        pace: paces ? `${formatPace(paces.race)} /km${targetTimeSec ? " (allure objectif)" : " (allure estimée)"}` : undefined,
      };
    case "race":
      return {
        rpe: "Selon la distance",
        label: "Course",
        talk: "Partez prudemment, accélérez si les sensations sont bonnes.",
        pace: paces ? `${formatPace(paces.race)} /km` : undefined,
      };
  }
}

const TITLES: Record<SessionType, string> = {
  easy: "Footing facile",
  recovery: "Footing de récupération",
  long: "Sortie longue",
  run_walk: "Course / marche",
  fartlek: "Fartlek",
  hills: "Côtes",
  tempo: "Seuil (tempo)",
  intervals: "Fractionné",
  race_pace: "Allure spécifique",
  shakeout: "Déblocage",
  race: "Jour J",
};

const SAFETY = " En cas de douleur inhabituelle, de malaise ou de doute, arrêtez la séance.";

type Built = { durationMin: number; structure: string[]; instructions: string; title?: string };

function buildQuality(type: SessionType, level: Level, goal: RunningGoal, progress: number, maxMin: number, short = false): Built {
  let warm = 15;
  let cool = 10;
  const fit = (core: (reps: number) => number, minReps: number, reps: number) => {
    let r = reps;
    while (r > minReps && warm + cool + core(r) > maxMin) r--;
    if (warm + cool + core(r) > maxMin) {
      warm = 10;
      cool = 5;
    }
    while (r > 1 && warm + cool + core(r) > maxMin) r--;
    return r;
  };
  const lv = { beginner: 0, intermediate: 1, advanced: 2 }[level];
  switch (type) {
    case "intervals": {
      const ranges = [[4, 6], [5, 8], [6, 10]][lv];
      const reps = fit((r) => r * 5, 3, short ? ranges[0] : Math.round(lerp(ranges[0], ranges[1], progress)));
      return {
        durationMin: warm + cool + reps * 5,
        structure: [`${warm} min d'échauffement facile`, `${reps} × 3 min à effort 8/10, récupération 2 min en trottinant`, `${cool} min de retour au calme`],
        instructions: "Les répétitions doivent être régulières : la dernière aussi rapide que la première. Si l'allure s'effondre, arrêtez le bloc." + SAFETY,
      };
    }
    case "tempo": {
      const totals = [[12, 20], [16, 30], [20, 40]][lv];
      const block = [10, 15, 20][lv];
      let total = Math.round(lerp(totals[0], totals[1], short ? 0 : progress));
      let blocks = Math.ceil(total / block);
      const core = () => total + (blocks - 1) * 2;
      while (warm + cool + core() > maxMin && total > 8) {
        total -= 2;
        blocks = Math.ceil(total / block);
      }
      if (warm + cool + core() > maxMin) {
        warm = 10;
        cool = 5;
      }
      const each = Math.round(total / blocks);
      return {
        durationMin: warm + cool + core(),
        structure: [`${warm} min d'échauffement facile`, blocks > 1 ? `${blocks} × ${each} min à allure seuil, récupération 2 min` : `${each} min en continu à allure seuil`, `${cool} min de retour au calme`],
        instructions: "Allure « confortablement difficile » : soutenue mais maîtrisée, sans finir épuisé." + SAFETY,
      };
    }
    case "fartlek": {
      const ranges = [[6, 10], [8, 12], [10, 15]][lv];
      warm = 10;
      const reps = fit((r) => r * 2, 4, Math.round(lerp(ranges[0], ranges[1], progress)));
      return {
        durationMin: warm + cool + reps * 2,
        structure: [`${warm} min facile`, `${reps} × (1 min vive / 1 min facile)`, `${cool} min facile`],
        instructions: "Jouez avec l'allure : les phases vives sont rapides mais relâchées, jamais au sprint." + SAFETY,
      };
    }
    case "hills": {
      const ranges = [[5, 8], [6, 10], [8, 12]][lv];
      const reps = fit((r) => Math.ceil(r * 2.25), 4, Math.round(lerp(ranges[0], ranges[1], progress)));
      return {
        durationMin: warm + cool + Math.ceil(reps * 2.25),
        structure: [`${warm} min d'échauffement facile vers une côte régulière`, `${reps} × 45 s en montée (effort 7–8/10), redescente en marchant ou trottinant`, `${cool} min de retour au calme`],
        instructions: "Buste droit, petits pas dynamiques, regard vers le haut de la côte. Sans côte, remplacez par des escaliers ou des accélérations de 30 s." + SAFETY,
      };
    }
    case "race_pace": {
      const spec: Record<RunningGoal, { reps: [number, number]; min: number; rec: number }> = {
        "5k": { reps: [3, 5], min: 4, rec: 2 },
        "10k": { reps: [3, 4], min: 8, rec: 2 },
        half: { reps: [2, 3], min: 12, rec: 3 },
        marathon: { reps: [2, 3], min: 15, rec: 3 },
      };
      const s = spec[goal];
      const unit = short ? Math.max(3, Math.round(s.min / 2)) : s.min;
      const target = short ? 2 : Math.round(lerp(s.reps[0], s.reps[1], progress));
      const reps = fit((r) => r * unit + (r - 1) * s.rec, 2, level === "beginner" ? Math.max(1, target - 1) : target);
      return {
        durationMin: warm + cool + reps * unit + (reps - 1) * s.rec,
        structure: [`${warm} min d'échauffement facile`, `${reps} × ${unit} min à allure de course, récupération ${s.rec} min en trottinant`, `${cool} min de retour au calme`],
        instructions: short
          ? "Séance de rappel : retrouvez les sensations de l'allure de course sans vous fatiguer."
          : "Mémorisez l'allure visée : régulière, économique, sans à-coups." + SAFETY,
      };
    }
    default:
      throw new Error(`Type de qualité inattendu : ${type}`);
  }
}

function easyInstructions(type: SessionType, withStrides: boolean): { instructions: string; structure: string[] } {
  switch (type) {
    case "long":
      return {
        structure: ["Course continue à allure facile", "Hydratez-vous si la sortie dépasse 1 h"],
        instructions: "Partez lentement : la sortie longue développe l'endurance, pas la vitesse. Terminer en ayant pu accélérer est bon signe." + SAFETY,
      };
    case "recovery":
      return {
        structure: ["Course très facile, sans chercher l'allure"],
        instructions: "Séance de récupération : plus lent que d'habitude. Remplacez-la par de la marche si vous êtes fatigué." + SAFETY,
      };
    default:
      return {
        structure: withStrides
          ? ["Course continue à allure facile", "Pour finir : 4 à 6 accélérations progressives de 20 s (lignes droites), récupération en marchant"]
          : ["Course continue à allure facile"],
        instructions: "Allure où vous pouvez parler en phrases complètes. Si vous êtes essoufflé, ralentissez ou marchez un instant." + SAFETY,
      };
  }
}

/**
 * Génère un programme course à pied.
 * Pur et déterministe : mêmes entrées → même programme.
 */
export function planRunning(input: RunningPlanInput, opts: PlanOptions): GeneratedPlan {
  const days = usableDays(input);
  if (days.length < 2) {
    throw new PlanInputError("Indiquez au moins deux jours disponibles (hors jours de repos).");
  }
  if (input.maxSessionMinutes < 20) {
    throw new PlanInputError("La durée maximale d'une séance doit être d'au moins 20 minutes.");
  }
  const start = opts.startDate;
  let raceDate: string;
  if (input.raceDate) {
    raceDate = input.raceDate;
  } else if (input.horizonWeeks && input.horizonWeeks > 0) {
    raceDate = addDays(mondayOf(start), input.horizonWeeks * 7 - 1);
  } else {
    throw new PlanInputError("Indiquez la date de votre course ou un horizon de préparation.");
  }
  if (diffDays(start, raceDate) < 0) {
    throw new PlanInputError("La date de course est déjà passée.");
  }

  const elapsed = opts.elapsedWeeks ?? 0;
  const offset = opts.weekIndexOffset ?? elapsed;
  const firstMonday = mondayOf(start);
  const remainingWeeks = Math.floor(diffDays(firstMonday, raceDate) / 7) + 1;
  const total = elapsed + remainingWeeks;
  const taper = Math.min(TAPER_WEEKS[input.goal], Math.max(1, Math.floor(total / 4)));

  const paces = computePaces(input);
  const warnings = elapsed === 0 ? assessRealism(input, remainingWeeks, paces) : [];
  const easyPace = paces ? (paces.easyMin + paces.easyMax) / 2 : DEFAULT_EASY_PACE[input.level];

  const n = Math.max(2, Math.min(days.length, MAX_RUNS[input.level], Math.max(3, input.runsPerWeek + 1)));
  const { runDays, longDay } = pickRunDays(days, n, input.longRunDay);

  const defaultStart = { none: 6, lt6m: 10, "6to24m": 15, gt2y: 20 }[input.experience];
  const scale = opts.volumeScale ?? 1;
  const capacity = (n * input.maxSessionMinutes * 60) / easyPace * 0.85;
  let peak = Math.max(PEAK_KM[input.goal][input.level], Math.min(input.weeklyVolumeKm, PEAK_KM[input.goal][input.level] * 1.3));
  peak = Math.min(peak, capacity);
  let startVol = (input.weeklyVolumeKm > 0 ? input.weeklyVolumeKm : defaultStart) * scale;
  startVol = Math.min(startVol, peak);
  const growth = input.level === "beginner" ? 1.07 : 1.08;
  const longInc = input.level === "beginner" ? 1.5 : 2;
  const longCap = LONG_CAP_KM[input.goal][input.level];
  const runWalk = input.experience === "none" && input.weeklyVolumeKm < 5;

  const weeks: PlannedWeek[] = [];
  const sessions: PlannedSession[] = [];
  let buildVol = startVol / growth;
  let lastBuildVol = startVol;
  let prevLong = (input.longestRunKm > 0 ? input.longestRunKm : startVol * 0.35) * 0.95;
  const buildCount = total - taper;

  for (let w = 0; w < remainingWeeks; w++) {
    const g = elapsed + w;
    const monday = addDays(firstMonday, w * 7);
    const phase = phaseOf(g, total, taper);
    const isRecovery = (phase === "base" || phase === "build" || phase === "specific") && (g + 1) % 4 === 0 && g < buildCount - 1;
    let vol: number;
    if (phase === "taper" || phase === "race") {
      const factors = TAPER_FACTORS[input.goal].slice(-taper);
      vol = lastBuildVol * factors[g - buildCount];
    } else if (isRecovery) {
      vol = buildVol * 0.75;
    } else {
      buildVol = Math.min(peak, buildVol * growth);
      vol = buildVol;
      lastBuildVol = vol;
    }

    const weekDates = runDays.map((d) => addDays(monday, d)).filter((d) => d >= start && d <= raceDate);
    const includesRace = raceDate >= monday && raceDate <= addDays(monday, 6);
    const trainingDates = weekDates.filter((d) => d !== raceDate);
    const fullVol = vol;
    const fraction = Math.min(1, trainingDates.length / n);
    vol *= fraction;

    const useRunWalk = runWalk && g < 6;
    let q = useRunWalk ? 0 : qualityCount(phase, input.level, n);
    if (isRecovery) q = Math.min(q, 1);
    // Pas de séance de qualité dans les 2 jours précédant la course.
    const qualityCandidates = runDays.filter((d) => {
      const date = addDays(monday, d);
      return date >= start && date <= raceDate && date !== raceDate && !(includesRace && diffDays(date, raceDate) <= 2);
    });
    const effectiveLongDay = includesRace ? -1 : longDay;
    q = Math.min(q, qualityCandidates.length - (effectiveLongDay >= 0 && qualityCandidates.includes(longDay) ? 1 : 0));
    const qualityDays = pickQualityDays(qualityCandidates, effectiveLongDay >= 0 ? longDay : -9, Math.max(0, q));
    const progress = buildCount > 1 ? Math.min(1, g / (buildCount - 1)) : 1;

    const weekSessions: PlannedSession[] = [];
    // Sortie longue
    let longKm = 0;
    const hasLong = !includesRace && trainingDates.includes(addDays(monday, longDay));
    if (hasLong) {
      const share = n === 2 ? 0.45 : n === 3 ? 0.35 : n >= 5 ? 0.28 : 0.32;
      const target = phase === "taper" ? fullVol * share : Math.min(fullVol * share, longCap, prevLong + longInc);
      longKm = Math.max(3, target);
      let dur = (longKm * easyPace * 1.02) / 60;
      if (dur > input.maxSessionMinutes) {
        dur = input.maxSessionMinutes;
        longKm = (dur * 60) / (easyPace * 1.02);
      }
      if (!isRecovery && phase !== "taper") prevLong = Math.max(prevLong, longKm);
      const type: SessionType = useRunWalk ? "run_walk" : "long";
      const base = easyInstructions("long", false);
      const structure = [...base.structure];
      let instructions = base.instructions;
      if (!useRunWalk && phase === "specific" && input.level !== "beginner" && (input.goal === "half" || input.goal === "marathon")) {
        structure.push(`Terminer par ${input.goal === "marathon" ? "20 à 30" : "15 à 20"} min à allure de course`);
        instructions = "Sortie longue avec finale à allure de course : restez facile sur la première partie." + SAFETY;
      }
      weekSessions.push(
        useRunWalk
          ? runWalkSession(g, addDays(monday, longDay), Math.min(input.maxSessionMinutes, 25 + g * 3), paces, offset + w)
          : {
              weekIndex: offset + w,
              date: addDays(monday, longDay),
              type,
              title: TITLES.long,
              durationMin: round5(dur),
              distanceKm: round05(longKm),
              intensity: intensityFor("long", paces, input.targetTimeSec),
              instructions,
              structure,
            },
      );
    }

    // Séances de qualité
    let qualityKm = 0;
    qualityDays.forEach((d, slot) => {
      const date = addDays(monday, d);
      const type = qualityType(phase, slot, input.goal, input.level, g);
      const isShort = phase === "race" || phase === "taper" || isRecovery;
      // Une séance de qualité ne dépasse pas ~30 % du volume de la semaine (échauffement compris).
      const qualityMax = Math.max(30, Math.min(input.maxSessionMinutes, (fullVol * 0.3 * easyPace * 0.9) / 60));
      const built = buildQuality(type, input.level, input.goal, progress, qualityMax, isShort);
      const km = round05((built.durationMin * 60) / (easyPace * 0.9));
      qualityKm += km;
      weekSessions.push({
        weekIndex: offset + w,
        date,
        type,
        title: isShort && type === "race_pace" ? "Rappel d'allure" : TITLES[type],
        durationMin: built.durationMin,
        distanceKm: km,
        intensity: intensityFor(type, paces, input.targetTimeSec),
        instructions: built.instructions,
        structure: built.structure,
      });
    });

    // Footings
    const easyDates = trainingDates.filter((d) => !weekSessions.some((s) => s.date === d));
    const easyTotal = Math.max(0, vol - longKm - qualityKm);
    easyDates.forEach((date, i) => {
      const dayBeforeRace = includesRace && diffDays(date, raceDate) === 1;
      if (useRunWalk) {
        weekSessions.push(runWalkSession(g, date, Math.min(input.maxSessionMinutes, 20 + g * 2), paces, offset + w));
        return;
      }
      let km = dayBeforeRace ? Math.min(4, easyTotal / easyDates.length) : Math.max(3, easyTotal / easyDates.length);
      let dur = (km * easyPace) / 60;
      if (dur > input.maxSessionMinutes) {
        dur = input.maxSessionMinutes;
        km = (dur * 60) / easyPace;
      }
      const type: SessionType = dayBeforeRace ? "shakeout" : isRecovery && i === 0 ? "recovery" : "easy";
      const withStrides = type === "easy" && input.level !== "beginner" && (phase === "build" || phase === "specific") && i === easyDates.length - 1;
      const ins = dayBeforeRace
        ? { structure: ["15 à 20 min très facile", "3 accélérations progressives de 15 s"], instructions: "Déblocage la veille : juste de quoi réveiller les jambes. Vous pouvez aussi vous reposer complètement." }
        : easyInstructions(type, withStrides);
      weekSessions.push({
        weekIndex: offset + w,
        date,
        type,
        title: TITLES[type],
        durationMin: dayBeforeRace ? 20 : round5(dur),
        distanceKm: dayBeforeRace ? round05(Math.min(km, (20 * 60) / easyPace)) : round05(km),
        intensity: intensityFor(type, paces, input.targetTimeSec),
        instructions: ins.instructions,
        structure: ins.structure,
      });
    });

    if (includesRace) {
      const goalKm = GOALS[input.goal].runDistanceKm;
      const estimated = paces ? paces.race * goalKm : goalKm * easyPace * 0.95;
      weekSessions.push({
        weekIndex: offset + w,
        date: raceDate,
        type: "race",
        title: input.raceDate ? `Jour J — ${GOALS[input.goal].label}` : `Test — ${GOALS[input.goal].label}`,
        durationMin: Math.round(estimated / 60),
        distanceKm: Math.round(goalKm * 10) / 10,
        intensity: intensityFor("race", paces, input.targetTimeSec),
        instructions: input.raceDate
          ? "Échauffez-vous 10 à 15 min (sauf marathon : 5 min suffisent). Partez à une allure légèrement plus prudente que prévu, puis ajustez. Buvez selon la chaleur. Bonne course !"
          : "Pas de course prévue : réalisez la distance objectif en solo ou en groupe, à l'effort visé, pour mesurer vos progrès." + SAFETY,
        structure: ["Échauffement court", `${GOALS[input.goal].label} à l'allure prévue`, "Récupération : marche et hydratation"],
      });
    }

    weekSessions.sort((a, b) => a.date.localeCompare(b.date));
    const weekVolume = weekSessions.reduce((s, x) => s + (x.distanceKm ?? 0), 0);
    weeks.push({
      weekIndex: offset + w,
      startDate: monday,
      phase,
      focus: isRecovery ? "Semaine allégée : assimiler le travail" : useRunWalk ? "Démarrer en douceur : alterner course et marche" : PHASE_FOCUS[phase],
      targetVolumeKm: Math.round(weekVolume * 10) / 10,
    });
    sessions.push(...weekSessions);
  }

  return { startDate: start, raceDate, weeks, sessions, warnings, paces, generatorVersion: GENERATOR_VERSION };

  function runWalkSession(g: number, date: string, durationMin: number, p: Paces | null, weekIndex: number): PlannedSession {
    const pattern = g < 2 ? "1 min de course / 1 min 30 de marche" : g < 4 ? "2 min de course / 1 min de marche" : "4 min de course / 1 min de marche";
    const dur = round5(durationMin);
    return {
      weekIndex,
      date,
      type: "run_walk",
      title: TITLES.run_walk,
      durationMin: dur,
      distanceKm: null,
      intensity: intensityFor("run_walk", p),
      instructions: "Alternez course très lente et marche active. L'objectif est de finir en ayant envie de recommencer." + SAFETY,
      structure: ["5 min de marche active", `Répéter : ${pattern} pendant ${Math.max(10, dur - 10)} min`, "5 min de marche"],
    };
  }
}

/** Jour de la semaine d'une date — réexporté pour l'interface. */
export { dayOfWeek };
