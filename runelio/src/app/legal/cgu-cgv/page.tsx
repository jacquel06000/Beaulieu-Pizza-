import type { Metadata } from "next";
import { LegalPage, Todo, Verify } from "@/components/legal/legal-page";
import { PRICING, PUBLISHER } from "@/lib/config";

export const metadata: Metadata = { title: "Conditions générales d'utilisation et de vente" };

export default function Page() {
  return (
    <LegalPage title="Conditions générales d'utilisation et de vente" updated="30 septembre 2026">
      <p>
        Les présentes conditions régissent l&apos;utilisation du site runelio.fr (partie A, CGU) et la souscription de l&apos;abonnement Runelio (partie B, CGV). Le service est édité par {PUBLISHER.name}, entrepreneur individuel, {PUBLISHER.address}, SIRET {PUBLISHER.siret}, <a href={`mailto:${PUBLISHER.email}`}>{PUBLISHER.email}</a> (ci-après « Runelio »). Il s&apos;adresse aux consommateurs résidant en France.
      </p>

      <h2>Partie A — Conditions générales d&apos;utilisation</h2>

      <h3>A1. Service</h3>
      <p>
        Runelio est un service en ligne qui génère des programmes d&apos;entraînement à la course à pied (5 km, 10 km, semi-marathon, marathon) à partir des informations fournies par l&apos;utilisateur. Le compte gratuit permet de renseigner son profil et de préparer sa demande ; la génération et la consultation du programme sont réservées aux abonnés.
      </p>

      <h3>A2. Compte</h3>
      <p>
        L&apos;inscription requiert une adresse e-mail valide, confirmée par un lien, et un mot de passe ; le téléphone est facultatif. Vous êtes responsable de la confidentialité de vos identifiants et de l&apos;exactitude des informations fournies. Le service n&apos;impose pas d&apos;âge minimum ; un mineur doit toutefois obtenir l&apos;autorisation de son représentant légal pour souscrire l&apos;abonnement payant.
      </p>

      <h3>A3. Nature des programmes — absence d&apos;avis médical</h3>
      <p>
        Les programmes sont des recommandations générales d&apos;entraînement établies automatiquement à partir de vos réponses. Ils <strong>ne constituent pas un avis médical</strong>, ne remplacent pas une consultation et ne tiennent compte d&apos;aucune information de santé. Il vous appartient de vérifier votre aptitude à la pratique de la course à pied (le cas échéant auprès d&apos;un médecin), d&apos;adapter les séances à vos sensations et d&apos;interrompre toute séance en cas de douleur, de malaise ou de doute.
      </p>
      <p>
        Runelio <strong>ne garantit aucun résultat</strong> (temps, classement, capacité à terminer une course). Les signalements d&apos;objectifs ou de délais manifestement irréalistes sont indicatifs.
      </p>

      <h3>A4. Utilisation</h3>
      <p>
        Le service est destiné à un usage personnel. Sont interdits : l&apos;accès non autorisé aux données d&apos;autrui, les tentatives de contournement des mesures de sécurité ou de paiement, l&apos;extraction automatisée et la revente des programmes. Runelio peut suspendre un compte en cas de manquement grave, après information de l&apos;utilisateur sauf urgence.
      </p>

      <h3>A5. Disponibilité et responsabilité</h3>
      <p>
        Runelio s&apos;efforce d&apos;assurer l&apos;accès au service mais ne peut garantir une disponibilité continue (maintenance, incidents). La responsabilité de Runelio ne saurait être engagée pour les dommages résultant d&apos;une utilisation du programme non conforme aux avertissements de l&apos;article A3, sans préjudice des droits que vous tenez de la loi. <Verify>clause de responsabilité au regard du droit de la consommation</Verify>
      </p>

      <h3>A6. Données personnelles</h3>
      <p>
        Voir la <a href="/legal/confidentialite">politique de confidentialité</a>.
      </p>

      <h2>Partie B — Conditions générales de vente de l&apos;abonnement</h2>

      <h3>B1. Offre et prix</h3>
      <p>
        Abonnement unique au prix de <strong>{PRICING.label} TTC</strong>, facturé à la souscription puis à chaque renouvellement, <strong>tous les {PRICING.billingPeriodDays} jours</strong>, sans frais supplémentaires.
      </p>
      <p>
        L&apos;abonnement est vendu par <strong>Whop</strong>, qui agit en tant que revendeur (« merchant of record ») : Whop encaisse le paiement, applique la TVA éventuellement due et vous adresse le reçu et la facture. Runelio fournit le service (programmes, calendrier, suivi). <Todo>entité Whop contractante</Todo></p>
      <p>L&apos;abonnement comprend : la génération d&apos;un programme personnalisé, son calendrier détaillé, le suivi des séances, le réajustement des semaines à venir, la génération d&apos;un nouveau programme si votre objectif change, et l&apos;accès à la page « Cadeaux du mois » (voir B8).</p>

      <h3>B2. Commande</h3>
      <p>
        Après avoir rempli le questionnaire et consulté le récapitulatif, vous cliquez sur « Générer mon programme ». Le détail de l&apos;offre vous est alors présenté (prix, fréquence, prestations, résiliation). Vous acceptez les présentes CGV, puis êtes redirigé vers la page de paiement sécurisée de Whop, où vous validez la commande. Le contrat est conclu à la confirmation du paiement. Whop vous adresse le reçu et la facture par e-mail.
      </p>
      <p>Aucun programme personnalisé n&apos;est généré ni affiché avant la confirmation du paiement, reçue par Runelio de manière sécurisée depuis Whop.</p>

      <h3>B3. Paiement</h3>
      <p>
        Le paiement est traité par Whop, revendeur de l&apos;abonnement. Runelio n&apos;a jamais accès à vos données de carte. Les renouvellements sont prélevés automatiquement sur le moyen de paiement enregistré auprès de Whop, que vous pouvez modifier depuis votre compte Whop.
      </p>
      <p>
        En cas d&apos;échec d&apos;un paiement de renouvellement, Whop peut effectuer de nouvelles tentatives pendant quelques jours ; pendant cette période, votre programme reste consultable mais ne peut pas être régénéré. Si le paiement n&apos;aboutit pas, l&apos;abonnement prend fin. <Verify>durée et modalités exactes des relances Whop</Verify>
      </p>

      <h3>B4. Durée, renouvellement et résiliation</h3>
      <p>
        L&apos;abonnement est <strong>sans engagement</strong> et se renouvelle automatiquement tous les {PRICING.billingPeriodDays} jours. Vous pouvez le résilier <strong>à tout moment</strong> :
      </p>
      <ul>
        <li>depuis votre espace, rubrique « Facturation », bouton « Résilier mon abonnement » ;</li>
        <li>
          via le lien « Résilier votre abonnement » accessible en bas de chaque page du site (<a href="/resiliation">/resiliation</a>) ;
        </li>
        <li>depuis votre compte Whop ;</li>
        <li>
          ou par e-mail à <a href={`mailto:${PUBLISHER.email}`}>{PUBLISHER.email}</a>.
        </li>
      </ul>
      <p>
        La résiliation prend effet à la fin de la période en cours, déjà payée ; aucun nouveau prélèvement n&apos;est effectué et l&apos;accès reste ouvert jusqu&apos;à cette date. Une confirmation indiquant la date de prise d&apos;effet vous est envoyée par e-mail. Vous pouvez annuler une résiliation programmée avant son échéance.
      </p>
      <p>
        <Verify>obligation d&apos;information préalable à la reconduction (article L215-1 du Code de la consommation) et modalités d&apos;envoi</Verify>
      </p>

      <h3 id="retractation">B5. Droit de rétractation</h3>
      <p>
        Vous disposez d&apos;un délai de <strong>14 jours</strong> à compter de la conclusion du contrat pour vous rétracter, sans motif, en nous adressant une déclaration dénuée d&apos;ambiguïté (par exemple par e-mail à {PUBLISHER.email}) ou le formulaire ci-dessous.
      </p>
      <p>
        Pour recevoir votre programme immédiatement, vous demandez expressément, avant le paiement, l&apos;exécution du service avant la fin du délai de rétractation et reconnaissez que vous perdez votre droit de rétractation pour le programme ainsi fourni.{" "}
        
      </p>
      <p>En cas de rétractation valable, le remboursement intervient dans les 14 jours, par le même moyen de paiement.</p>
      <p>
        <strong>Modèle de formulaire de rétractation</strong> (à compléter et renvoyer uniquement si vous souhaitez vous rétracter) : « À l&apos;attention de {PUBLISHER.name}, {PUBLISHER.address}, {PUBLISHER.email} : je vous notifie par la présente ma rétractation du contrat portant sur l&apos;abonnement Runelio. Commandé le : … Nom : … Adresse e-mail du compte : … Date : … »
      </p>

      <h3>B6. Conformité</h3>
      <p>
        Runelio est tenu des défauts de conformité du service numérique dans les conditions prévues par le Code de la consommation (articles L224-25-1 et suivants). <Verify>rédaction de la clause de garantie légale de conformité</Verify>
      </p>

      <h3>B7. Évolution du prix et des conditions</h3>
      <p>
        Toute modification du prix ou des présentes conditions vous est notifiée par e-mail au moins <Todo>délai</Todo> avant son application ; vous pouvez résilier avant son entrée en vigueur.
      </p>

      <h3>B8. Cadeaux du mois</h3>
      <p>
        Des lots peuvent être attribués par tirage au sort entre les abonnés participants, exclusivement selon un règlement publié. <strong>L&apos;abonnement ne garantit pas de gagner.</strong> Aucun tirage n&apos;est organisé tant que le règlement n&apos;est pas défini et validé.
      </p>

      <h3>B9. Réclamations et médiation</h3>
      <p>
        Pour toute réclamation : <a href={`mailto:${PUBLISHER.email}`}>{PUBLISHER.email}</a>. En l&apos;absence de solution amiable, vous pouvez recourir gratuitement au médiateur de la consommation : <Todo>nom, adresse et site du médiateur de la consommation auquel l&apos;éditeur adhère (obligatoire)</Todo>.
      </p>

      <h3>B10. Droit applicable</h3>
      <p>Les présentes conditions sont soumises au droit français. En cas de litige, les tribunaux compétents sont déterminés selon les règles de droit commun, le consommateur pouvant saisir la juridiction de son domicile.</p>
    </LegalPage>
  );
}
