import type { Metadata } from "next";
import { LegalPage, Todo, Verify } from "@/components/legal/legal-page";
import { PUBLISHER } from "@/lib/config";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function Page() {
  return (
    <LegalPage title="Politique de confidentialité" updated="30 septembre 2026">
      <p>
        Cette politique explique quelles données personnelles Runelio traite, pourquoi, pendant combien de temps et quels sont vos droits. Elle décrit le fonctionnement réel du service tel qu&apos;il est développé à la date indiquée.
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        {PUBLISHER.name}, entrepreneur individuel, {PUBLISHER.address} (SIRET {PUBLISHER.siret}). Contact pour toute question ou demande relative à vos données :{" "}
        <a href={`mailto:${PUBLISHER.email}`}>{PUBLISHER.email}</a>. Aucun délégué à la protection des données n&apos;a été désigné <Verify>absence d&apos;obligation de désignation</Verify>.
      </p>

      <h2>2. Données traitées</h2>
      <table>
        <thead>
          <tr>
            <th>Catégorie</th>
            <th>Données</th>
            <th>Origine</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Compte</td>
            <td>Adresse e-mail, prénom ou pseudo, mot de passe (conservé uniquement sous forme d&apos;empreinte cryptographique, jamais en clair), téléphone <em>(facultatif)</em>, statut de vérification de l&apos;e-mail, dates de création et de mise à jour.</td>
            <td>Vous</td>
          </tr>
          <tr>
            <td>Sécurité</td>
            <td>Sessions de connexion (adresse IP, navigateur/appareil, dates), compteurs anti-abus associés à l&apos;adresse IP ou au compte, jetons temporaires de vérification d&apos;e-mail et de réinitialisation du mot de passe.</td>
            <td>Générées lors de l&apos;utilisation</td>
          </tr>
          <tr>
            <td>Préparation sportive</td>
            <td>Objectif de course, date ou horizon, objectif chronométrique facultatif, niveau, ancienneté de pratique, nombre de sorties et kilométrage hebdomadaires, plus longue sortie récente, résultat de référence facultatif, jours et créneaux disponibles, jours de repos, durée maximale de séance.</td>
            <td>Vous (questionnaire)</td>
          </tr>
          <tr>
            <td>Programme et suivi</td>
            <td>Programme généré (semaines, séances), séances marquées comme réalisées, réajustements.</td>
            <td>Service</td>
          </tr>
          <tr>
            <td>Abonnement et paiements</td>
            <td>Identifiants techniques Whop de l&apos;abonnement et des paiements, statut, montant, devise, dates, motif d&apos;échec éventuel ; date de votre acceptation des CGV et de votre demande d&apos;exécution immédiate. <strong>Runelio ne reçoit ni ne conserve vos données de carte bancaire</strong>, saisies uniquement sur la page de Whop.</td>
            <td>Vous et Whop</td>
          </tr>
          <tr>
            <td>Facturation</td>
            <td>Si des factures sont émises par l&apos;éditeur : numéro, nom, e-mail, montant, date.</td>
            <td>Service</td>
          </tr>
          <tr>
            <td>Consentements</td>
            <td>Historique de vos choix concernant les e-mails d&apos;actualités (date, choix, version du texte).</td>
            <td>Vous</td>
          </tr>
          <tr>
            <td>Cadeaux du mois</td>
            <td>Participations et désignation des gagnants (fonctionnalité inactive tant qu&apos;aucun règlement n&apos;est en vigueur).</td>
            <td>Vous</td>
          </tr>
          <tr>
            <td>Échanges</td>
            <td>Contenu des e-mails que vous nous adressez.</td>
            <td>Vous</td>
          </tr>
        </tbody>
      </table>
      <h3>Données de santé</h3>
      <p>
        Runelio ne vous demande <strong>aucune information médicale</strong> (diagnostic, blessure, traitement, pathologie…) et vous invite à ne pas en communiquer. Les informations d&apos;entraînement demandées (volume, allures, résultats) servent uniquement à construire le programme ; aucune déduction sur votre état de santé n&apos;en est tirée. <Verify>qualification de ces données au regard de la notion de « données concernant la santé » ; si une collecte de données de santé devenait nécessaire, elle serait précédée d&apos;une analyse (finalité, base légale au titre de l&apos;article 9 du RGPD, garanties, éventuel hébergement certifié HDS)</Verify>
      </p>

      <h2>3. Finalités et bases légales</h2>
      <table>
        <thead>
          <tr>
            <th>Finalité</th>
            <th>Base légale</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Créer et gérer votre compte, enregistrer votre questionnaire, générer et afficher votre programme, suivi et réajustements</td>
            <td>Exécution du contrat (CGU/CGV)</td>
          </tr>
          <tr>
            <td>Gérer l&apos;abonnement : paiement, renouvellement, échecs de paiement, résiliation, e-mails transactionnels</td>
            <td>Exécution du contrat</td>
          </tr>
          <tr>
            <td>Tenue de la comptabilité et des factures</td>
            <td>Obligation légale</td>
          </tr>
          <tr>
            <td>Sécuriser le service : vérification de l&apos;e-mail, limitation des tentatives, journalisation des sessions</td>
            <td>Intérêt légitime (protéger les comptes et le service)</td>
          </tr>
          <tr>
            <td>Vous envoyer des actualités et offres par e-mail</td>
            <td>Consentement, facultatif et retirable à tout moment</td>
          </tr>
          <tr>
            <td>Organiser les tirages au sort des cadeaux du mois (lorsqu&apos;un règlement est en vigueur)</td>
            <td>
              Exécution du règlement accepté <Verify>base légale</Verify>
            </td>
          </tr>
          <tr>
            <td>Conserver la preuve de vos consentements et de leur retrait ; gérer les demandes d&apos;exercice de droits</td>
            <td>Obligation légale / intérêt légitime</td>
          </tr>
        </tbody>
      </table>
      <p>
        La génération du programme est automatisée mais ne produit pas d&apos;effet juridique vous concernant au sens de l&apos;article 22 du RGPD ; vous pouvez modifier vos réponses et réajuster votre programme à tout moment.
      </p>

      <h2>4. Destinataires</h2>
      <p>Vos données sont accessibles uniquement à l&apos;éditeur et, pour ce qui les concerne, aux prestataires suivants :</p>
      <table>
        <thead>
          <tr>
            <th>Prestataire</th>
            <th>Rôle</th>
            <th>Données</th>
            <th>Localisation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Hostinger</td>
            <td>Hébergement du site et de la base de données</td>
            <td>Toutes les données du service</td>
            <td>
              <Todo>entité contractante, localisation du centre de données choisi, accord de sous-traitance (article 28 RGPD)</Todo>
            </td>
          </tr>
          <tr>
            <td>Whop</td>
            <td>Revendeur de l&apos;abonnement (« merchant of record ») : vente, paiement, facturation</td>
            <td>Runelio transmet un identifiant technique de compte ; vous communiquez directement à Whop vos coordonnées et moyen de paiement. Whop renvoie à Runelio le statut de l&apos;abonnement et des paiements.</td>
            <td>
              Responsable de traitement distinct pour les données de paiement et de facturation qu&apos;il collecte. <Todo>entité contractante, localisation, mécanisme d&apos;encadrement des transferts hors UE</Todo>
            </td>
          </tr>
          <tr>
            <td>
              Hostinger (messagerie)
            </td>
            <td>Envoi des e-mails transactionnels (vérification, mot de passe, résiliation) et, si vous y consentez, des actualités</td>
            <td>Adresse e-mail, prénom, contenu des e-mails</td>
            <td>
              <Todo>localisation et garanties</Todo>
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Aucun outil de mesure d&apos;audience, de publicité ou de réseau social n&apos;est intégré au site. Les polices de caractères sont hébergées sur nos serveurs : aucune donnée n&apos;est transmise à un service de polices tiers. Vos données ne sont ni vendues ni louées.
      </p>

      <h2>5. Transferts hors de l&apos;Union européenne</h2>
      <p>
        Whop est une société dont le siège est situé hors de l&apos;Union européenne <Verify>pays et entité</Verify>. Le transfert éventuel de vos données vers ce prestataire doit être encadré par un mécanisme prévu par le RGPD (décision d&apos;adéquation, dont le cadre de protection des données UE–États-Unis si le prestataire y est certifié, ou clauses contractuelles types). <Todo>mécanisme applicable et moyen d&apos;en obtenir une copie</Todo>
      </p>

      <h2>6. Durées de conservation</h2>
      <table>
        <thead>
          <tr>
            <th>Données</th>
            <th>Durée</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Compte, questionnaire, programmes, suivi, consentements</td>
            <td>
              Jusqu&apos;à la suppression du compte (possible à tout moment depuis « Compte »). Les comptes ne sont pas supprimés automatiquement en cas d&apos;inactivité.
            </td>
          </tr>
          <tr>
            <td>Sessions de connexion</td>
            <td>30 jours maximum à compter de la dernière prolongation, ou jusqu&apos;à déconnexion / suppression du compte</td>
          </tr>
          <tr>
            <td>Lien de vérification de l&apos;e-mail / de réinitialisation du mot de passe</td>
            <td>24 heures / 30 minutes</td>
          </tr>
          <tr>
            <td>Factures et pièces comptables (dont l&apos;historique des paiements)</td>
            <td>10 ans à compter de la clôture de l&apos;exercice (obligation légale), y compris après suppression du compte, sans lien avec celui-ci</td>
          </tr>
          <tr>
            <td>Journal technique des notifications de paiement (identifiants et types d&apos;événements)</td>
            <td>
              <Todo>durée</Todo>
            </td>
          </tr>
          <tr>
            <td>Participations aux tirages au sort</td>
            <td>
              <Todo>durée prévue au règlement</Todo>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>7. Sécurité</h2>
      <p>
        Mots de passe stockés sous forme d&apos;empreinte (algorithme scrypt), connexions chiffrées (HTTPS), cookies de session sécurisés, limitation des tentatives de connexion, contrôle d&apos;accès côté serveur sur chaque donnée, vérification cryptographique des notifications de paiement, politique de sécurité du contenu (CSP) et accès restreint à la base de données.
      </p>

      <h2>8. Vos droits</h2>
      <p>
        Vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition (notamment à la prospection, à tout moment), de portabilité, du droit de retirer votre consentement à tout moment, et du droit de définir des directives relatives au sort de vos données après votre décès.
      </p>
      <ul>
        <li>
          <strong>En autonomie :</strong> depuis « Compte », vous pouvez modifier vos informations, exporter l&apos;ensemble de vos données (format JSON), gérer votre consentement aux actualités et supprimer votre compte.
        </li>
        <li>
          <strong>Par e-mail :</strong> <a href={`mailto:${PUBLISHER.email}`}>{PUBLISHER.email}</a>. Une réponse vous est apportée dans un délai d&apos;un mois, prolongeable dans les conditions prévues par le RGPD. Un justificatif d&apos;identité peut être demandé en cas de doute raisonnable.
        </li>
      </ul>
      <p>
        Vous pouvez introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" rel="noopener noreferrer">cnil.fr</a>).
      </p>

      <h2>9. Cookies</h2>
      <p>
        Voir la <a href="/legal/cookies">politique de cookies</a>.
      </p>

      <h2>10. Mineurs</h2>
      <p>
        Le service n&apos;impose pas d&apos;âge minimum. Pour un mineur de moins de 15 ans, le consentement aux e-mails d&apos;actualités doit être donné conjointement avec le titulaire de l&apos;autorité parentale.
      </p>

      <h2>11. Modifications</h2>
      <p>En cas de modification substantielle, vous en serez informé par e-mail ou dans votre espace avant son entrée en vigueur.</p>
    </LegalPage>
  );
}
