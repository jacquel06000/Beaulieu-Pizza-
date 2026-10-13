import { APIError } from "better-auth/api";
import { getDb } from "@/db";
import { stripeConfigured } from "@/lib/env";
import { canViewPlan } from "./access";
import { getCurrentSubscription, upsertSubscription } from "./billing";
import { stripeGateway } from "./stripe";

/**
 * Avant suppression du compte : arrête l'abonnement Stripe (résiliation immédiate).
 * Si Stripe est injoignable, la suppression est refusée pour éviter de continuer
 * à prélever un compte supprimé.
 * Les factures sont conservées (obligation comptable), sans lien avec le compte.
 */
export async function onBeforeAccountDeletion(userId: string): Promise<void> {
  const db = getDb();
  const sub = await getCurrentSubscription(db, userId);
  if (!sub || !canViewPlan(sub)) return;
  const refuse = (message: string) => new APIError("SERVICE_UNAVAILABLE", { message });
  if (!stripeConfigured()) throw refuse("Résiliez d'abord votre abonnement avant de supprimer le compte.");
  try {
    const s = await stripeGateway.cancelNow(sub.stripeSubscriptionId);
    await upsertSubscription(db, s, userId, new Date());
  } catch {
    throw refuse("Impossible de résilier l'abonnement auprès de Stripe pour le moment. Réessayez plus tard ou contactez-nous.");
  }
}
