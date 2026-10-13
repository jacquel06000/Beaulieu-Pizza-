/**
 * Règles d'accès liées à l'abonnement. Fonctions pures, testées.
 *
 * Statuts Stripe : `active`/`trialing` donnent accès ; une résiliation programmée
 * (`cancelAtPeriodEnd`) donne accès jusqu'à la fin de la période payée ; `past_due`
 * est la période de relance après un échec de paiement : consultation seulement,
 * pas de nouvelle génération ; `canceled`, `unpaid`, `incomplete`,
 * `incomplete_expired`, `paused` : aucun accès.
 * (`canceling` est conservé pour compatibilité, Stripe ne l'utilise pas.)
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
