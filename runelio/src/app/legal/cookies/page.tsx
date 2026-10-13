import type { Metadata } from "next";
import { CookieSettingsButton } from "@/components/cookie-consent";
import { LegalPage, Verify } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Politique de cookies" };

export default function Page() {
  return (
    <LegalPage title="Politique de cookies" updated="13 octobre 2026">
      <p>
        Un cookie est un petit fichier déposé sur votre appareil. Runelio n&apos;utilise <strong>que des cookies strictement nécessaires</strong> au fonctionnement du service ; ils sont exemptés de consentement. <strong>Aucun cookie de mesure d&apos;audience, de publicité ou de réseau social n&apos;est déposé.</strong>
      </p>

      <h2>Cookies utilisés</h2>
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Finalité</th>
            <th>Durée</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>runelio.session_token</code> (préfixé <code>__Secure-</code> en HTTPS)
            </td>
            <td>Maintenir votre connexion de façon sécurisée</td>
            <td>30 jours maximum, ou fin de la session de navigation si « Rester connecté » est décoché</td>
          </tr>
          <tr>
            <td>
              <code>runelio.dont_remember</code>
            </td>
            <td>Mémoriser que vous ne souhaitez pas rester connecté</td>
            <td>Session de navigation</td>
          </tr>
          <tr>
            <td>
              <code>runelio_consent</code>
            </td>
            <td>Mémoriser vos choix en matière de cookies facultatifs (déposé uniquement si vous en exprimez un)</td>
            <td>6 mois</td>
          </tr>
        </tbody>
      </table>
      <p>
        <Verify>liste exacte des cookies observée dans le navigateur sur l&apos;environnement de production</Verify>
      </p>

      <h2>Paiement</h2>
      <p>
        Le paiement s&apos;effectue sur la page sécurisée de Stripe (checkout.stripe.com), vers laquelle vous êtes redirigé ; il en va de même pour l&apos;espace de gestion du moyen de paiement (billing.stripe.com). Aucun script Stripe n&apos;est chargé sur runelio.fr. Les cookies déposés par Stripe sur ses propres pages, notamment pour la prévention de la fraude, relèvent de sa <a href="https://stripe.com/fr/legal/cookies-policy" rel="noopener noreferrer">politique relative aux cookies</a>.
      </p>

      <h2>Cookies facultatifs</h2>
      <p>
        Si un outil nécessitant votre consentement était ajouté à l&apos;avenir (par exemple une mesure d&apos;audience), il ne serait activé qu&apos;après votre accord explicite, recueilli par un bandeau permettant d&apos;accepter ou de refuser aussi simplement, et cette politique serait mise à jour. Vous pouvez à tout moment consulter ou modifier vos choix :
      </p>
      <p>
        <CookieSettingsButton className="rounded-full bg-ink px-5 py-2.5 font-semibold text-white" />
      </p>
    </LegalPage>
  );
}
