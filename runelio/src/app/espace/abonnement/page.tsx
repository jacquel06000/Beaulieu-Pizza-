import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OfferDetails } from "@/components/offer/offer-details";
import { CheckoutForm } from "@/components/space/checkout-form";
import { AccessBanner } from "@/components/space/access-banner";
import { Alert, ButtonLink, Card, PageHeader } from "@/components/ui";
import { whopConfigured } from "@/lib/env";
import { canGeneratePlan } from "@/server/access";
import { requirePageUser } from "@/server/session";
import { loadSpaceState } from "@/server/views";

export const metadata: Metadata = { title: "Abonnement" };

export default async function Page() {
  const user = await requirePageUser("/espace/abonnement");
  const { sub, profile, pending, access, lastPayment } = await loadSpaceState(user.id);
  if (canGeneratePlan(sub)) redirect("/espace/recapitulatif");
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader eyebrow="Abonnement" title="Débloquez votre programme personnalisé">
        Votre programme sera généré uniquement après la confirmation du paiement par notre prestataire.
      </PageHeader>
      <AccessBanner access={access} periodEnd={sub?.currentPeriodEnd ?? null} pending={pending} lastPaymentStatus={lastPayment?.status} />
      {!profile && (
        <Alert tone="warning">
          Remplissez d&apos;abord le questionnaire. <ButtonLink href="/espace/questionnaire" variant="secondary" className="ml-2">Questionnaire</ButtonLink>
        </Alert>
      )}
      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <Card className="p-6 sm:p-8">
          <OfferDetails />
        </Card>
        <Card className="h-fit md:sticky md:top-24">
          <h2 className="text-xl font-bold mb-4">Récapitulatif de commande</h2>
          <div className="flex justify-between text-sm py-2 border-b border-line">
            <span>Abonnement Runelio (30 jours)</span>
            <span className="font-semibold">19,99 €</span>
          </div>
          <div className="flex justify-between py-3 font-bold">
            <span>Total aujourd&apos;hui</span>
            <span>19,99 €</span>
          </div>
          <p className="mb-5 text-xs text-muted">Puis 19,99 € tous les 30 jours jusqu&apos;à résiliation. TVA non applicable, art. 293 B du CGI.</p>
          {profile ? <CheckoutForm configured={whopConfigured()} /> : null}
        </Card>
      </div>
    </div>
  );
}
