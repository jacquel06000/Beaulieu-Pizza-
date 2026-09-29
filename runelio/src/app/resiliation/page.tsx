import type { Metadata } from "next";
import { ButtonLink, Card, Container, PageHeader } from "@/components/ui";
import { PUBLISHER } from "@/lib/config";

export const metadata: Metadata = { title: "Résilier votre abonnement" };

/** Accès direct et permanent à la résiliation en ligne. */
export default function Page() {
  return (
    <Container className="py-12 max-w-2xl">
      <PageHeader eyebrow="Abonnement" title="Résilier votre abonnement">
        La résiliation est gratuite, possible à tout moment, et prend effet à la fin de la période déjà payée.
      </PageHeader>
      <Card className="space-y-4">
        <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
          <li>Connectez-vous à votre compte (identification requise pour vérifier qu&apos;il s&apos;agit bien de votre abonnement).</li>
          <li>Cliquez sur « Résilier mon abonnement » puis confirmez.</li>
          <li>Vous recevez un e-mail de confirmation indiquant la date de fin de votre accès.</li>
        </ol>
        <ButtonLink href="/connexion?next=%2Fespace%2Ffacturation%23resilier" variant="primary">Accéder à la résiliation</ButtonLink>
        <p className="text-sm text-muted">
          Vous n&apos;arrivez pas à vous connecter ? Écrivez à <a className="underline" href={`mailto:${PUBLISHER.email}?subject=R%C3%A9siliation%20abonnement%20Runelio`}>{PUBLISHER.email}</a> depuis l&apos;adresse de votre compte. Vous pouvez aussi résilier directement depuis votre compte Whop.
        </p>
      </Card>
    </Container>
  );
}
