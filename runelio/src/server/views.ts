import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { payment } from "@/db/schema";
import { accessState } from "./access";
import { getCurrentSubscription, hasPendingCheckout } from "./billing";
import { getProfile } from "./plans";

/** Données d'état communes aux pages de l'espace. */
export async function loadSpaceState(userId: string) {
  const db = getDb();
  const [sub, profile, pending, [lastPayment]] = await Promise.all([
    getCurrentSubscription(db, userId),
    getProfile(db, userId),
    hasPendingCheckout(db, userId),
    db.select().from(payment).where(eq(payment.userId, userId)).orderBy(desc(payment.updatedAt)).limit(1),
  ]);
  return { sub, profile, pending, lastPayment: lastPayment ?? null, access: accessState(sub) };
}

export function formatDateLong(d: Date | null | undefined) {
  return d ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(d) : "—";
}
