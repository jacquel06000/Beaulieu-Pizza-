import { PRICING, PUBLISHER } from "@/lib/config";

export const INCLUDED = [
  "Génération d'un programme de préparation personnalisé (5 km, 10 km, semi-marathon ou marathon)",
  "Calendrier hebdomadaire détaillé : type de séance, durée ou distance, intensité et consignes",
  "Suivi des séances réalisées",
  "Réajustement des semaines à venir selon vos disponibilités et vos séances réalisées",
  "Nouveau programme si votre objectif change",
  "Accès à la page « Cadeaux du mois » (participation aux tirages uniquement lorsqu'un règlement est en vigueur ; aucun gain garanti)",
];

/** Informations précontractuelles affichées avant tout paiement. */
export function OfferDetails({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-display text-5xl font-extrabold">
          {PRICING.label}
          <span className="text-lg font-semibold text-muted"> / mois</span>
        </p>
        <ul className="mt-3 space-y-1 text-sm text-ink-soft">
          <li>
            <strong>Montant facturé :</strong> {PRICING.label} à la souscription, puis {PRICING.label} à chaque renouvellement.
          </li>
          <li>
            <strong>Fréquence :</strong> renouvellement automatique tous les {PRICING.billingPeriodDays} jours.
          </li>
          <li>
            <strong>TVA :</strong> {PUBLISHER.vatMention}. Le prix affiché est le prix total demandé par Runelio.
          </li>
          <li>
            <strong>Paiement :</strong> sur la page sécurisée de notre prestataire Whop. Le montant exact à payer y est affiché avant validation ; Runelio ne voit ni ne conserve vos données de carte.
          </li>
        </ul>
      </div>
      {!compact && (
        <div>
          <h3 className="font-bold">Ce qui est inclus</h3>
          <ul className="mt-3 space-y-2">
            {INCLUDED.map((i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span aria-hidden className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-lime text-[11px] font-bold">✓</span>
                {i}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="rounded-xl bg-paper p-4 text-sm leading-relaxed space-y-2">
        <p>
          <strong>Sans engagement, résiliation à tout moment</strong> depuis votre espace (Facturation) ou via le lien « Résilier votre abonnement » présent sur chaque page. La résiliation prend effet à la fin de la période déjà payée ; aucun nouveau prélèvement n&apos;est effectué.
        </p>
        <p>
          <strong>Droit de rétractation :</strong> vous disposez de 14 jours à compter de la souscription. Pour accéder immédiatement à votre programme, vous demandez l&apos;exécution du service avant la fin de ce délai ; les conséquences sur votre droit de rétractation sont détaillées dans les{" "}
          <a className="underline" href="/legal/cgu-cgv#retractation">CGV</a>.
        </p>
      </div>
    </div>
  );
}
