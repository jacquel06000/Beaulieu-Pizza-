import type { Metadata } from "next";
import { LegalPage, Todo, Verify } from "@/components/legal/legal-page";
import { PUBLISHER } from "@/lib/config";

export const metadata: Metadata = { title: "Mentions légales" };

export default function Page() {
  return (
    <LegalPage title="Mentions légales" updated="29 septembre 2026">
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
          Immatriculation : <Todo>registre d&apos;immatriculation (RNE, et RCS le cas échéant) selon la nature de l&apos;activité déclarée</Todo>
        </li>
        <li>
          Adresse électronique : <a href={`mailto:${PUBLISHER.email}`}>{PUBLISHER.email}</a>
        </li>
        <li>
          Téléphone : <Todo>numéro de téléphone permettant de contacter l&apos;éditeur</Todo>
        </li>
        <li>
          TVA : {PUBLISHER.vatMention}. <Verify>confirmation du bénéfice de la franchise en base de TVA</Verify>
        </li>
        <li>Directeur de la publication : {PUBLISHER.name}</li>
      </ul>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par <strong>Hostinger</strong>.{" "}
        <Todo>dénomination sociale exacte de l&apos;entité Hostinger contractante, adresse postale, numéro de téléphone, service souscrit (VPS, hébergement cloud…) et localisation effective des serveurs</Todo>
      </p>

      <h2>Paiement</h2>
      <p>
        Les paiements et la gestion de l&apos;abonnement sont assurés par l&apos;intermédiaire de <strong>Whop</strong>.{" "}
        <Todo>dénomination sociale et adresse de l&apos;entité Whop contractante, et son rôle (prestataire de paiement ou revendeur « merchant of record »)</Todo>
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
