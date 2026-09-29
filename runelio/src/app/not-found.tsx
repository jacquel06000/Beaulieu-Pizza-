import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-24 max-w-xl text-center">
      <p className="font-display text-7xl font-extrabold text-brand">404</p>
      <h1 className="mt-4 text-2xl font-bold">Cette page s&apos;est perdue en chemin</h1>
      <p className="mt-2 text-muted">Le lien est peut-être incorrect ou la page n&apos;existe plus.</p>
      <ButtonLink href="/" className="mt-8">Retour à l&apos;accueil</ButtonLink>
    </Container>
  );
}
