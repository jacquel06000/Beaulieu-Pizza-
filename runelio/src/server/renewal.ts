/**
 * Rappel avant renouvellement (information sur la reconduction, art. L215-1 C. conso.) :
 * un e-mail environ 7 jours avant chaque échéance, une seule fois par échéance.
 */
import { and, eq, gt, isNull, lte, ne, or } from "drizzle-orm";
import type { Db } from "@/db";
import { subscription, user } from "@/db/schema";
import { PRICING } from "@/lib/config";
import { layoutEmail } from "./mailer";

const DAY = 86_400_000;
export const RENEWAL_NOTICE_DAYS = 7;

type Mail = { to: string; subject: string; text: string; html?: string };

export async function sendRenewalReminders(db: Db, send: (m: Mail) => Promise<void>, appUrl: string, now = new Date()) {
  const horizon = new Date(now.getTime() + RENEWAL_NOTICE_DAYS * DAY);
  const due = await db
    .select({ id: subscription.id, end: subscription.currentPeriodEnd, email: user.email, name: user.name })
    .from(subscription)
    .innerJoin(user, eq(user.id, subscription.userId))
    .where(
      and(
        eq(subscription.status, "active"),
        eq(subscription.cancelAtPeriodEnd, false),
        gt(subscription.currentPeriodEnd, now),
        lte(subscription.currentPeriodEnd, horizon),
        or(isNull(subscription.renewalReminderFor), ne(subscription.renewalReminderFor, subscription.currentPeriodEnd)),
      ),
    );

  let sent = 0;
  for (const s of due) {
    const end = s.end!;
    // Réservation avant l'envoi : deux exécutions simultanées n'envoient pas deux fois.
    const claimed = await db
      .update(subscription)
      .set({ renewalReminderFor: end })
      .where(and(eq(subscription.id, s.id), or(isNull(subscription.renewalReminderFor), ne(subscription.renewalReminderFor, end))))
      .returning({ id: subscription.id });
    if (!claimed.length) continue;
    const date = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(end);
    try {
      await send({
        to: s.email,
        subject: `Runelio — renouvellement de votre abonnement le ${date}`,
        ...layoutEmail(
          `Bonjour ${s.name}, votre abonnement se renouvelle bientôt`,
          `Votre abonnement Runelio sera renouvelé automatiquement le ${date}, pour ${PRICING.label} TTC (période de ${PRICING.billingPeriodDays} jours). Le paiement sera prélevé par Whop sur votre moyen de paiement enregistré.\n\nVous n'avez rien à faire pour continuer. Si vous ne souhaitez pas être renouvelé, vous pouvez résilier sans frais avant cette date : vous conserverez l'accès jusqu'au ${date}.`,
          { label: "Gérer ou résilier mon abonnement", url: `${appUrl}/resiliation` },
        ),
      });
      sent++;
    } catch (e) {
      // Échec d'envoi : on libère la réservation pour réessayer au prochain passage.
      await db.update(subscription).set({ renewalReminderFor: null }).where(eq(subscription.id, s.id));
      console.error("[mail] rappel de renouvellement", e);
    }
  }
  return { sent };
}
