/**
 * Registre des disciplines et objectifs.
 *
 * Le triathlon et l'Ironman sont modélisés mais marqués `available: false` :
 * ils ne sont proposés nulle part tant qu'un planificateur réel
 * (natation + vélo + course à pied) n'est pas implémenté et enregistré ici.
 */
export type Sport = "running" | "triathlon";
export type RunningGoal = "5k" | "10k" | "half" | "marathon";
export type TriathlonGoal = "tri_sprint" | "tri_olympic" | "tri_70_3" | "ironman";
export type Goal = RunningGoal | TriathlonGoal;

export type GoalDefinition = {
  id: Goal;
  sport: Sport;
  label: string;
  shortLabel: string;
  /** Distance de course à pied (km). */
  runDistanceKm: number;
};

export const GOALS: Record<Goal, GoalDefinition> = {
  "5k": { id: "5k", sport: "running", label: "5 km", shortLabel: "5 km", runDistanceKm: 5 },
  "10k": { id: "10k", sport: "running", label: "10 km", shortLabel: "10 km", runDistanceKm: 10 },
  half: { id: "half", sport: "running", label: "Semi-marathon (21,1 km)", shortLabel: "Semi", runDistanceKm: 21.0975 },
  marathon: { id: "marathon", sport: "running", label: "Marathon (42,2 km)", shortLabel: "Marathon", runDistanceKm: 42.195 },
  tri_sprint: { id: "tri_sprint", sport: "triathlon", label: "Triathlon S", shortLabel: "Tri S", runDistanceKm: 5 },
  tri_olympic: { id: "tri_olympic", sport: "triathlon", label: "Triathlon M", shortLabel: "Tri M", runDistanceKm: 10 },
  tri_70_3: { id: "tri_70_3", sport: "triathlon", label: "Half Ironman (70.3)", shortLabel: "70.3", runDistanceKm: 21.0975 },
  ironman: { id: "ironman", sport: "triathlon", label: "Ironman", shortLabel: "Ironman", runDistanceKm: 42.195 },
};

export const SPORTS: Record<Sport, { label: string; available: boolean; goals: Goal[] }> = {
  running: { label: "Course à pied", available: true, goals: ["5k", "10k", "half", "marathon"] },
  // Non disponible : aucune planification natation/vélo n'est implémentée.
  triathlon: { label: "Triathlon", available: false, goals: ["tri_sprint", "tri_olympic", "tri_70_3", "ironman"] },
};

export function availableGoals(): GoalDefinition[] {
  return (Object.keys(SPORTS) as Sport[])
    .filter((s) => SPORTS[s].available)
    .flatMap((s) => SPORTS[s].goals.map((g) => GOALS[g]));
}

export function isAvailableGoal(goal: string): goal is RunningGoal {
  return availableGoals().some((g) => g.id === goal);
}
