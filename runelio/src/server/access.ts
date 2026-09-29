/**
 * Règles d'accès liées à l'abonnement. Fonctions pures, testées.
 *
 * Statuts Whop (membership) : `active`/`trialing` donnent accès ; `canceling`
 * (résiliation programmée) donne accès jusqu'à la fin de période ; `past_due`
 * est la période de grâce après un échec de paiement (Whop relance pendant
 * quelques jours) : consultation seulement, pas de nouvelle génération ;
 * `canceled`, `expired`, `completed`, `unresolved`, `drafted` : aucun accès.
 */
export type SubscriptionLike = {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
} | null | undefined;

const FULL_ACCESS = new Set(["active", "trialing", "canceling"]);
const READ_ONLY_ACCESS = new Set(["past_due"]);

function periodOver(sub: NonNullable<SubscriptionLike>, now: Date): boolean {
  // Une résiliation programmée cesse à la fin de la période payée.
  if ((sub.status === "canceling" || sub.cancelAtPeriodEnd) && sub.currentPeriodEnd) {
    return sub.currentPeriodEnd.getTime() <= now.getTime();
  }
  return false;
}

/** Peut générer ou réajuster un programme. */
export function canGeneratePlan(sub: SubscriptionLike, now = new Date()): boolean {
  return Boolean(sub && FULL_ACCESS.has(sub.status) && !periodOver(sub, now));
}

/** Peut consulter son programme et marquer des séances. */
export function canViewPlan(sub: SubscriptionLike, now = new Date()): boolean {
  return Boolean(sub && (FULL_ACCESS.has(sub.status) || READ_ONLY_ACCESS.has(sub.status)) && !periodOver(sub, now));
}

export type AccessState = "none" | "active" | "canceling" | "past_due" | "ended";

export function accessState(sub: SubscriptionLike, now = new Date()): AccessState {
  if (!sub) return "none";
  if (periodOver(sub, now)) return "ended";
  if (sub.status === "past_due") return "past_due";
  if (sub.status === "canceling" || (FULL_ACCESS.has(sub.status) && sub.cancelAtPeriodEnd)) return "canceling";
  if (FULL_ACCESS.has(sub.status)) return "active";
  return "ended";
}
