import type { Metadata } from "next";
import { OfferDetails } from "@/components/offer/offer-details";
import { ButtonLink, Card, Container, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Tarif" };

export default function PricingPage() {
  return (
    <Container className="py-12 sm:py-16 max-w-4xl">
      <PageHeader eyebrow="Tarif" title="Un abonnement unique, sans surprise">
        L&apos;inscription est gratuite. L&apos;abonnement est nécessaire pour générer votre programme personnalisé.
      </PageHeader>
      <div className="grid gap-6 md:grid-cols-[1fr_0.8fr]">
        <Card className="p-6 sm:p-8">
          <OfferDetails />
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
