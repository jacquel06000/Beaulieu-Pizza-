import type { Metadata } from "next";
import { OfferDetails } from "@/components/offer/offer-details";
import { headers } from "next/headers";
import { ButtonLink, Card, Container, PageHeader } from "@/components/ui";
import { PRICING } from "@/lib/config";
import { getSessionUser } from "@/server/session";

export const metadata: Metadata = { title: "Tarif" };

export default async function PricingPage() {
  // Rendu dynamique (session) ; doit rester hors du try/catch.
  await headers();
  let loggedIn = false;
  try {
    loggedIn = Boolean(await getSessionUser());
  } catch {
    loggedIn = false;
  }
  // Visiteur : le compte et le questionnaire sont nécessaires pour générer le programme après paiement.
  const subscribeHref = loggedIn ? "/espace/abonnement" : "/inscription";
  return (
    <Container className="py-12 sm:py-16 max-w-4xl">
      <PageHeader eyebrow="Tarif" title="Un abonnement unique, sans surprise">
        L&apos;inscription est gratuite. L&apos;abonnement est nécessaire pour générer votre programme personnalisé.
      </PageHeader>
      <div className="grid gap-6 md:grid-cols-[1fr_0.8fr]">
        <Card className="p-6 sm:p-8">
          <OfferDetails />
          <ButtonLink href={subscribeHref} variant="brand" className="mt-6 w-full min-h-12 text-base">
            S&apos;abonner — {PRICING.label} / mois
          </ButtonLink>
          {!loggedIn && (
            <p className="mt-3 text-center text-xs text-muted leading-relaxed">
              Étapes : créer votre compte, répondre au questionnaire (quelques minutes), puis payer. Votre programme est généré dès la confirmation du paiement.
            </p>
          )}
        </Card>
        <div className="space-y-4">
          <Card className="bg-lime-soft ring-0">
            <h2 className="text-xl font-bold">Gratuit</h2>
            <p className="mt-2 text-sm text-ink-soft leading-relaxed">Compte, questionnaire et récapitulatif de votre demande. Aucun moyen de paiement demandé.</p>
            <ButtonLink href="/inscription" variant="primary" className="mt-4 w-full">Créer mon compte gratuit</ButtonLink>
          </Card>
          <Card>
            <h2 className="font-bold">Bon à savoir</h2>
            <ul className="mt-2 space-y-2 text-sm text-muted leading-relaxed list-disc pl-5">
              <li>Aucun programme n&apos;est généré avant la confirmation du paiement par notre prestataire.</li>
              <li>Les programmes sont des recommandations générales d&apos;entraînement, pas un avis médical.</li>
              <li>Aucun résultat en course n&apos;est garanti.</li>
            </ul>
          </Card>
        </div>
      </div>
    </Container>
  );
}
