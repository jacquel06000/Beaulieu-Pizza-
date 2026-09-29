import type { RunningGoal } from "../sports";

export type Level = "beginner" | "intermediate" | "advanced";
export type Experience = "none" | "lt6m" | "6to24m" | "gt2y";

export type RunningPlanInput = {
  goal: RunningGoal;
  /** Date de course (YYYY-MM-DD). Prioritaire sur `horizonWeeks`. */
  raceDate?: string | null;
  horizonWeeks?: number | null;
  targetTimeSec?: number | null;
  level: Level;
  experience: Experience;
  runsPerWeek: number;
  weeklyVolumeKm: number;
  longestRunKm: number;
  refDistanceKm?: number | null;
  refTimeSec?: number | null;
  /** 0 = lundi … 6 = dimanche. */
  availableDays: number[];
  restDays: number[];
  longRunDay?: number | null;
  maxSessionMinutes: number;
};

export type SessionType =
  | "easy"
  | "recovery"
  | "long"
  | "run_walk"
  | "fartlek"
  | "hills"
  | "tempo"
  | "intervals"
  | "race_pace"
  | "shakeout"
  | "race";

export type Intensity = { rpe: string; label: string; talk: string; pace?: string };

export type PlannedSession = {
  weekIndex: number;
  date: string;
  type: SessionType;
  title: string;
  durationMin: number;
  distanceKm: number | null;
  intensity: Intensity;
  instructions: string;
  structure: string[];
};

export type Phase = "base" | "build" | "specific" | "taper" | "race";

export type PlannedWeek = {
  weekIndex: number;
  startDate: string;
  phase: Phase;
  focus: string;
  targetVolumeKm: number;
};

export type Warning = {
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
};

/** Allures en secondes par kilomètre. */
export type Paces = {
  easyMin: number;
  easyMax: number;
  threshold: number;
  interval: number;
  marathon: number;
  race: number;
};

export type GeneratedPlan = {
  startDate: string;
  raceDate: string;
  weeks: PlannedWeek[];
  sessions: PlannedSession[];
  warnings: Warning[];
  paces: Paces | null;
  generatorVersion: string;
};

export type PlanOptions = {
  /** Premier jour planifiable (YYYY-MM-DD). */
  startDate: string;
  /** Indice de la première semaine générée (réajustement). */
  weekIndexOffset?: number;
  /** Coefficient appliqué au volume de départ (ex. 0,9 si séances manquées). */
  volumeScale?: number;
  /** Semaines déjà réalisées avant `startDate` (pour le calcul des phases). */
  elapsedWeeks?: number;
};
