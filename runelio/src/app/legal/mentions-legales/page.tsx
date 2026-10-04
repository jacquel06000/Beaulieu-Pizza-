import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { PUBLISHER } from "@/lib/config";

export const metadata: Metadata = { title: "Mentions légales" };

export default function Page() {
  return (
    <LegalPage title="Mentions légales" updated="5 octobre 2026">
      <h2>Éditeur du site</h2>
      <p>
        Le site <strong>runelio.fr</strong> est édité par <strong>{PUBLISHER.name}</strong>, entrepreneur individuel (régime de la micro-entreprise).
      </p>
      <ul>
        <li>Adresse professionnelle : {PUBLISHER.address}</li>
        <li>
          SIREN : {PUBLISHER.siren} — SIRET : {PUBLISHER.siret}
        </li>
        <li>
          Immatriculation : {PUBLISHER.siren} R.C.S. Paris
        </li>
        <li>
          Adresse électronique : <a href={`mailto:${PUBLISHER.email}`}>{PUBLISHER.email}</a>
        </li>
        <li>
          TVA : {PUBLISHER.vatMention}
        </li>
        <li>Directeur de la publication : {PUBLISHER.name}</li>
      </ul>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par <strong>Hostinger International Ltd</strong>, 61 Lordou Vironos Street, 6023 Larnaca, Chypre — <a href="https://www.hostinger.fr" rel="noopener noreferrer">www.hostinger.fr</a>. Les serveurs sont situés à Paris (France).
      </p>

      <h2>Paiement</h2>
      <p>
        L&apos;abonnement est vendu par <strong>Whop</strong>, qui agit en tant que revendeur (« merchant of record ») : Whop encaisse le paiement, applique la TVA éventuelle et émet les reçus et factures. Société : Whop Inc., 300 Kent Ave #401, Brooklyn, NY 11249, États-Unis.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les contenus du site (textes, logo, interface, programmes générés) sont protégés par le droit de la propriété intellectuelle. Toute reproduction ou diffusion au-delà de l&apos;usage personnel prévu par les conditions générales est interdite sans autorisation.
      </p>
      <p>Les polices de caractères Inter et Bricolage Grotesque sont distribuées sous licence SIL Open Font License et hébergées sur nos propres serveurs.</p>

      <h2>Contact</h2>
      <p>
        Pour toute question, y compris relative à vos données personnelles : <a href={`mailto:${PUBLISHER.email}`}>{PUBLISHER.email}</a>.
      </p>
    </LegalPage>
  );
}
