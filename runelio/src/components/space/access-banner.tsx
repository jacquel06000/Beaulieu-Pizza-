import type { AccessState } from "@/server/access";
import { formatDateLong } from "@/server/views";
import { Alert, ButtonLink } from "../ui";

export function AccessBanner({ access, periodEnd, pending, lastPaymentStatus }: { access: AccessState; periodEnd: Date | null; pending: boolean; lastPaymentStatus?: string | null }) {
  if (access === "past_due") {
    return (
      <Alert tone="warning" title="Paiement du renouvellement en échec">
        Votre programme reste consultable pendant que notre prestataire relance le paiement, mais vous ne pouvez pas en générer un nouveau. Mettez à jour votre moyen de paiement depuis la page Facturation.
        <div className="mt-3"><ButtonLink href="/espace/facturation" variant="secondary">Gérer la facturation</ButtonLink></div>
      </Alert>
    );
  }
  if (access === "canceling") {
    return <Alert tone="info">Résiliation enregistrée : votre accès reste ouvert jusqu&apos;au {formatDateLong(periodEnd)}.</Alert>;
  }
  if (access === "ended") {
    return (
      <Alert tone="warning" title="Abonnement terminé">
        Votre abonnement a pris fin. Vos réponses sont conservées ; réabonnez-vous pour accéder à nouveau à votre programme.
      </Alert>
    );
  }
  if (access === "none" && lastPaymentStatus === "failed") {
    return <Alert tone="critical" title="Paiement refusé">Votre dernier paiement n&apos;a pas abouti. Aucun montant n&apos;a été prélevé par Runelio ; vous pouvez réessayer.</Alert>;
  }
  if (access === "none" && pending) {
    return <Alert tone="info">Un paiement a été initié récemment. S&apos;il a été validé, votre accès sera activé dès sa confirmation par notre prestataire.</Alert>;
  }
  return null;
}
