import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { invoice, payment } from "@/db/schema";
import { AccessBanner } from "@/components/space/access-banner";
import { CancelSubscription, ReactivateSubscription } from "@/components/space/billing-actions";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import { formatEuros, PUBLISHER } from "@/lib/config";
import { env } from "@/lib/env";
import { requirePageUser } from "@/server/session";
import { formatDateLong, loadSpaceState } from "@/server/views";
import { WHOP_CUSTOMER_MEMBERSHIPS_URL } from "@/server/whop";

export const metadata: Metadata = { title: "Facturation" };

const PAYMENT_LABELS: Record<string, { label: string; tone: "mint" | "warn" | "danger" | "neutral" }> = {
  succeeded: { label: "Payé", tone: "mint" },
  pending: { label: "En attente", tone: "warn" },
  created: { label: "Initié", tone: "neutral" },
  requires_action: { label: "Action requise", tone: "warn" },
  authorized: { label: "Autorisé", tone: "neutral" },
  failed: { label: "Échoué", tone: "danger" },
  canceled: { label: "Annulé", tone: "neutral" },
};

export default async function Page() {
  const user = await requirePageUser("/espace/facturation");
  const { sub, access, pending, lastPayment } = await loadSpaceState(user.id);
  const db = getDb();
  const payments = await db.select().from(payment).where(eq(payment.userId, user.id)).orderBy(desc(payment.createdAt)).limit(24);
  const invoicesEnabled = env().INVOICES_ENABLED;
  const invoices = invoicesEnabled ? await db.select().from(invoice).where(eq(invoice.userId, user.id)).orderBy(desc(invoice.issuedAt)) : [];
  const statusLabel = { none: "Aucun abonnement", active: "Actif", canceling: "Résiliation programmée", past_due: "Paiement en échec", ended: "Terminé" }[access];

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader eyebrow="Facturation" title="Mon abonnement" />
      <AccessBanner access={access} periodEnd={sub?.currentPeriodEnd ?? null} pending={pending} lastPaymentStatus={lastPayment?.status} />
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Statut</p>
            <p className="text-xl font-bold">{statusLabel}</p>
          </div>
          <Badge tone={access === "active" ? "mint" : access === "none" || access === "ended" ? "neutral" : "warn"}>19,99 € / 30 jours</Badge>
        </div>
        {sub && (access === "active" || access === "past_due") && (
          <p className="mt-3 text-sm text-muted">Prochain renouvellement : {formatDateLong(sub.currentPeriodEnd)}</p>
        )}
        {sub && access === "canceling" && <p className="mt-3 text-sm text-muted">Fin de l&apos;accès : {formatDateLong(sub.currentPeriodEnd)}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          {(access === "active" || access === "past_due") && <CancelSubscription periodEnd={formatDateLong(sub?.currentPeriodEnd)} />}
          {access === "canceling" && <ReactivateSubscription />}
          {(access === "none" || access === "ended") && <ButtonLink href="/espace/abonnement">S&apos;abonner</ButtonLink>}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Moyen de paiement</h2>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          Vos données de carte sont gérées exclusivement par Whop ; Runelio ne les voit ni ne les stocke. Pour modifier votre moyen de paiement, connectez-vous à votre compte Whop (avec l&apos;adresse utilisée lors du paiement), rubrique abonnements, puis « Update payment method ».
        </p>
        <a href={WHOP_CUSTOMER_MEMBERSHIPS_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-white px-5 font-semibold ring-1 ring-line hover:ring-ink/30">
          Gérer mon moyen de paiement sur Whop ↗
        </a>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Historique des paiements</h2>
        {payments.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Aucun paiement pour le moment.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Paiements</caption>
              <thead>
                <tr className="text-left text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Date</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Montant</th>
                  <th scope="col" className="py-2 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="py-3 pr-4">{formatDateLong(p.paidAt ?? p.createdAt)}</td>
                    <td className="py-3 pr-4">{p.amountCents != null ? formatEuros(p.amountCents) : "—"}</td>
                    <td className="py-3">
                      <Badge tone={PAYMENT_LABELS[p.status]?.tone ?? "neutral"}>{PAYMENT_LABELS[p.status]?.label ?? p.status}</Badge>
                      {p.failureMessage && <span className="block text-xs text-muted mt-1">{p.failureMessage}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {invoicesEnabled ? (
          invoices.length > 0 && (
            <ul className="mt-5 space-y-2 text-sm">
              {invoices.map((i) => (
                <li key={i.id}>
                  <a href={`/api/invoices/${i.id}`} target="_blank" className="font-semibold underline">Facture {i.number}</a> — {formatDateLong(i.issuedAt)}
                </li>
              ))}
            </ul>
          )
        ) : (
          <p className="mt-4 text-xs text-muted">Whop, notre prestataire de paiement, vous envoie par e-mail un reçu de chaque paiement. Pour obtenir une facture, écrivez-nous à {PUBLISHER.email}.</p>
        )}
      </Card>
    </div>
  );
}
