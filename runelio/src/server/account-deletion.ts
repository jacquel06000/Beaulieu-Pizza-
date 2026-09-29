import { APIError } from "better-auth/api";
import { getDb } from "@/db";
import { whopConfigured } from "@/lib/env";
import { canViewPlan } from "./access";
import { getCurrentSubscription, upsertMembership } from "./billing";
import { whopGateway } from "./whop";

/**
 * Avant suppression du compte : stoppe le renouvellement de l'abonnement Whop
 * (résiliation immédiate). Si Whop est injoignable, la suppression est refusée
 * pour éviter de continuer à prélever un compte supprimé.
 * Les factures sont conservées (obligation comptable), sans lien avec le compte.
 */
export async function onBeforeAccountDeletion(userId: string): Promise<void> {
  const db = getDb();
  const sub = await getCurrentSubscription(db, userId);
  if (!sub || !canViewPlan(sub)) return;
  const refuse = (message: string) => new APIError("SERVICE_UNAVAILABLE", { message });
  if (!whopConfigured()) throw refuse("Résiliez d'abord votre abonnement avant de supprimer le compte.");
  try {
    const m = await whopGateway.cancelMembership(sub.whopMembershipId, false, "Suppression du compte runelio.fr");
    await upsertMembership(db, m, userId, new Date());
  } catch {
    throw refuse("Impossible de résilier l'abonnement auprès de Whop pour le moment. Réessayez plus tard ou contactez-nous.");
  }
}
