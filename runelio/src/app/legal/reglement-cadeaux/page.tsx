import type { Metadata } from "next";
import { LegalPage, Todo, Verify } from "@/components/legal/legal-page";
import { PUBLISHER } from "@/lib/config";

export const metadata: Metadata = { title: "Règlement des cadeaux du mois", robots: { index: false } };

export default function Page() {
  return (
    <LegalPage title="Règlement des cadeaux du mois" updated="29 septembre 2026">
      <p className="rounded-xl bg-danger-soft p-4 text-danger font-semibold">
        RÈGLEMENT INACTIF — Aucun tirage au sort n&apos;est organisé à ce jour. Ce projet ne produira d&apos;effet qu&apos;une fois les lots, les conditions de participation et les modalités définis, validés au regard du droit français et publiés.
      </p>

      <h2>Article 1 — Organisateur</h2>
      <p>
        {PUBLISHER.name}, entrepreneur individuel, {PUBLISHER.address}, SIRET {PUBLISHER.siret} (« l&apos;Organisateur »), organise des tirages au sort mensuels intitulés « Cadeaux du mois ».
      </p>

      <h2>Article 2 — Durée</h2>
      <p>
        <Todo>période de participation de chaque tirage (dates et heures de début et de fin, fuseau horaire de Paris)</Todo>
      </p>

      <h2>Article 3 — Conditions de participation</h2>
      <p>
        <Todo>personnes admises (âge, résidence en France…), exclusions (organisateur, proches…), limite d&apos;une participation par personne, modalités d&apos;inscription au tirage</Todo>
      </p>
      <p>
        <Verify>
          conformité du lien entre abonnement payant et participation (articles L121-20 du Code de la consommation et L322-1 et suivants du Code de la sécurité intérieure), et opportunité d&apos;une participation sans obligation d&apos;achat
        </Verify>
      </p>

      <h2>Article 4 — Lots</h2>
      <p>
        <Todo>description précise de chaque lot, valeur commerciale indicative TTC, nombre de gagnants, impossibilité d&apos;échange contre leur valeur en numéraire le cas échéant</Todo>
      </p>

      <h2>Article 5 — Désignation des gagnants</h2>
      <p>
        Les gagnants sont désignés par tirage au sort parmi les participations valides. <Todo>date du tirage, méthode (logiciel de tirage aléatoire, présence éventuelle d&apos;un commissaire de justice), conservation des preuves</Todo>
      </p>
      <p>La participation ne garantit pas de gagner. L&apos;abonnement à Runelio ne donne droit à aucun lot en dehors du tirage.</p>

      <h2>Article 6 — Information des gagnants et remise des lots</h2>
      <p>
        <Todo>mode d&apos;information (e-mail), délai pour répondre, sort des lots non réclamés, modalités et délais de livraison ou de remise</Todo>
      </p>

      <h2>Article 7 — Données personnelles</h2>
      <p>
        Les données de participation sont traitées par l&apos;Organisateur pour gérer le tirage et la remise des lots. <Todo>durée de conservation, éventuelle publication du nom des gagnants avec leur accord</Todo>. Voir la <a href="/legal/confidentialite">politique de confidentialité</a>.
      </p>

      <h2>Article 8 — Dépôt et consultation du règlement</h2>
      <p>
        <Todo>dépôt éventuel auprès d&apos;un commissaire de justice ; le règlement est consultable gratuitement sur cette page</Todo>
      </p>

      <h2>Article 9 — Responsabilité, modification, litiges</h2>
      <p>
        <Todo>cas de modification ou d&apos;annulation, responsabilité, droit applicable (français) et réclamations à adresser à {PUBLISHER.email}</Todo>
      </p>
    </LegalPage>
  );
}
