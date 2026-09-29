import { describe, expect, it } from "vitest";
import { addDays, dayOfWeek, diffDays } from "@/domain/dates";
import { pickQualityDays, pickRunDays, planRunning, PlanInputError } from "@/domain/planning/running";
import type { RunningPlanInput } from "@/domain/planning/types";
import { availableGoals, isAvailableGoal, SPORTS } from "@/domain/sports";

const base: RunningPlanInput = {
  goal: "10k",
  raceDate: "2026-12-13",
  targetTimeSec: null,
  level: "intermediate",
  experience: "6to24m",
  runsPerWeek: 3,
  weeklyVolumeKm: 20,
  longestRunKm: 10,
  availableDays: [1, 3, 5, 6],
  restDays: [],
  longRunDay: 6,
  maxSessionMinutes: 75,
};
const START = "2026-09-30";
const HARD = new Set(["intervals", "tempo", "race_pace", "hills", "fartlek"]);

const scenarios: RunningPlanInput[] = [];
for (const goal of ["5k", "10k", "half", "marathon"] as const)
  for (const level of ["beginner", "intermediate", "advanced"] as const)
    for (const days of [[0, 2, 4], [1, 3, 5, 6], [0, 1, 2, 3, 4, 5, 6], [5, 6]])
      scenarios.push({ ...base, goal, level, availableDays: days, raceDate: goal === "marathon" ? "2027-03-07" : "2026-12-13", maxSessionMinutes: goal === "marathon" ? 180 : 90 });

describe("planificateur course à pied", () => {
  it.each(scenarios.map((s, i) => [i, s] as const))("respecte les contraintes (scénario %i)", (_i, input) => {
    const plan = planRunning(input, { startDate: START });
    const allowed = new Set(input.availableDays.filter((d) => !input.restDays.includes(d)));
    // Course le jour J, en dernière séance.
    const last = plan.sessions[plan.sessions.length - 1];
    expect(last.type).toBe("race");
    expect(last.date).toBe(input.raceDate);
    for (const s of plan.sessions) {
      expect(s.date >= START).toBe(true);
      expect(s.date <= input.raceDate!).toBe(true);
      if (s.type !== "race") {
        // Uniquement les jours disponibles, jamais les jours de repos.
        expect(allowed.has(dayOfWeek(s.date))).toBe(true);
        // Durée maximale de séance respectée.
        expect(s.durationMin).toBeLessThanOrEqual(input.maxSessionMinutes);
      }
      expect(s.instructions.length).toBeGreaterThan(20);
      expect(s.intensity.rpe).toBeTruthy();
    }
    // Une seule séance par jour.
    const dates = plan.sessions.map((s) => s.date);
    expect(new Set(dates).size).toBe(dates.length);
    // Pas deux séances difficiles consécutives, pas de séance difficile la veille de la course.
    const hard = plan.sessions.filter((s) => HARD.has(s.type) && s.title !== "Rappel d'allure").map((s) => s.date);
    for (let i = 1; i < hard.length; i++) {
      if (allowed.size >= 4) expect(diffDays(hard[i - 1], hard[i])).toBeGreaterThan(1);
    }
    for (const s of plan.sessions.filter((x) => HARD.has(x.type))) {
      expect(diffDays(s.date, input.raceDate!)).toBeGreaterThan(2);
    }
  });

  it("progresse graduellement puis s'affûte", () => {
    const plan = planRunning({ ...base, goal: "half", raceDate: "2027-01-31", weeklyVolumeKm: 25, maxSessionMinutes: 150 }, { startDate: "2026-10-05" });
    const loading = plan.weeks.filter((w) => w.phase !== "race" && w.phase !== "taper" && !w.focus.startsWith("Semaine allégée"));
    for (let i = 1; i < loading.length; i++) {
      // +12 % maximum d'une semaine de charge à la suivante (arrondis inclus).
      expect(loading[i].targetVolumeKm).toBeLessThanOrEqual(loading[i - 1].targetVolumeKm * 1.12 + 1.5);
    }
    const peak = Math.max(...plan.weeks.map((w) => w.targetVolumeKm));
    const taper = plan.weeks.filter((w) => w.phase === "taper");
    expect(taper.length).toBeGreaterThan(0);
    for (const w of taper) expect(w.targetVolumeKm).toBeLessThan(peak);
    // Semaine allégée toutes les 4 semaines.
    expect(plan.weeks.some((w) => w.focus.startsWith("Semaine allégée"))).toBe(true);
  });

  it("utilise un horizon quand aucune date n'est fixée", () => {
    const plan = planRunning({ ...base, raceDate: null, horizonWeeks: 8 }, { startDate: "2026-10-05" });
    expect(plan.weeks).toHaveLength(8);
    expect(plan.sessions.at(-1)!.title).toMatch(/^Test/);
  });

  it("propose course/marche aux grands débutants", () => {
    const plan = planRunning(
      { ...base, goal: "5k", level: "beginner", experience: "none", weeklyVolumeKm: 0, runsPerWeek: 0, longestRunKm: 0, availableDays: [0, 2, 5] },
      { startDate: "2026-10-05" },
    );
    expect(plan.sessions.slice(0, 3).every((s) => s.type === "run_walk")).toBe(true);
  });

  it("donne des allures quand un résultat de référence est connu", () => {
    const plan = planRunning({ ...base, refDistanceKm: 5, refTimeSec: 25 * 60 }, { startDate: START });
    expect(plan.paces).not.toBeNull();
    expect(plan.sessions.find((s) => s.type === "easy")!.intensity.pace).toMatch(/\/km/);
  });

  it("signale les objectifs manifestement irréalistes sans rien garantir", () => {
    const tooFast = planRunning({ ...base, targetTimeSec: 20 * 60 }, { startDate: START });
    expect(tooFast.warnings.find((w) => w.code === "target_unrealistic")?.severity).toBe("critical");

    const bigGain = planRunning({ ...base, refDistanceKm: 10, refTimeSec: 60 * 60, targetTimeSec: 45 * 60 }, { startDate: START });
    expect(bigGain.warnings.some((w) => w.code === "target_unrealistic")).toBe(true);

    const reasonable = planRunning({ ...base, refDistanceKm: 10, refTimeSec: 52 * 60, targetTimeSec: 50 * 60 }, { startDate: START });
    expect(reasonable.warnings.some((w) => w.code.startsWith("target_"))).toBe(false);

    const rushed = planRunning({ ...base, goal: "marathon", level: "beginner", experience: "none", raceDate: addDays(START, 35) }, { startDate: START });
    expect(rushed.warnings.some((w) => w.code === "timeline_too_short" && w.severity === "critical")).toBe(true);
    for (const w of [...tooFast.warnings, ...rushed.warnings]) expect(w.message).not.toMatch(/garanti/i);
  });

  it("refuse les entrées impossibles", () => {
    expect(() => planRunning({ ...base, availableDays: [2] }, { startDate: START })).toThrow(PlanInputError);
    expect(() => planRunning({ ...base, availableDays: [1, 3], restDays: [3] }, { startDate: START })).toThrow(PlanInputError);
    expect(() => planRunning({ ...base, raceDate: "2026-01-01" }, { startDate: START })).toThrow(PlanInputError);
  });

  it("est déterministe", () => {
    expect(planRunning(base, { startDate: START })).toEqual(planRunning(base, { startDate: START }));
  });

  it("réajuste à partir d'une semaine donnée en conservant la date de course", () => {
    const plan = planRunning({ ...base, availableDays: [0, 2, 4, 6] }, { startDate: "2026-11-04", elapsedWeeks: 5, weekIndexOffset: 5, volumeScale: 0.9 });
    expect(plan.weeks[0].weekIndex).toBe(5);
    expect(plan.sessions.at(-1)!.date).toBe(base.raceDate);
    expect(plan.warnings).toHaveLength(0);
  });
});

describe("répartition des jours", () => {
  it("place la sortie longue le week-end et espace les séances", () => {
    const { runDays, longDay } = pickRunDays([0, 1, 2, 3, 4, 5, 6], 3);
    expect(longDay).toBe(6);
    expect(runDays).toHaveLength(3);
    expect(pickQualityDays(runDays, longDay, 1).every((d) => Math.abs(d - longDay) > 1)).toBe(true);
  });
});

describe("disciplines", () => {
  it("n'expose pas le triathlon tant qu'il n'est pas planifiable", () => {
    expect(SPORTS.triathlon.available).toBe(false);
    expect(availableGoals().map((g) => g.id)).toEqual(["5k", "10k", "half", "marathon"]);
    expect(isAvailableGoal("ironman")).toBe(false);
  });
});
