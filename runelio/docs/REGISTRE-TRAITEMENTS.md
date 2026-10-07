# Registre des activités de traitement — Runelio

Document **interne** tenu en application de l'article 30 du RGPD. Il n'est pas publié sur le site, mais doit pouvoir être présenté à la CNIL sur demande. Il est rédigé à partir du fonctionnement réel du code (octobre 2026) et doit être mis à jour à chaque nouvelle fonctionnalité, nouveau prestataire ou nouvelle donnée collectée.

- **Responsable du traitement** : Alexandre Jacquel, micro-entrepreneur — 47 rue Vivienne, 75002 Paris — SIREN 929 658 961 — jacquelalexandrepro@gmail.com
- **Délégué à la protection des données (DPO)** : non désigné (non obligatoire : pas de suivi à grande échelle ni de données sensibles).
- **Représentant dans l'UE** : sans objet (responsable établi en France).
- **Date de création du registre** : 7 octobre 2026 — **Dernière mise à jour** : 7 octobre 2026

---

## Prestataires (sous-traitants et destinataires)

| Prestataire | Rôle | Données | Localisation | Garanties |
|---|---|---|---|---|
| Hostinger International Ltd (61 Lordou Vironos Street, 6023 Larnaca, Chypre) | Sous-traitant : hébergement du site et de la base de données (VPS) | Toutes les données du service | Centre de données à Paris (France) | Accord de sous-traitance (art. 28) accepté |
| Hostinger (messagerie) | Sous-traitant : envoi des e-mails | E-mail, prénom, contenu des messages | **À compléter** (localisation des serveurs de messagerie) | Même accord de sous-traitance |
| Whop Inc. (300 Kent Ave #401, Brooklyn, NY 11249, États-Unis) | Prestataire de paiement (encaisse pour le compte de l'éditeur, qui reste le vendeur) ; responsable de traitement distinct pour les données de paiement qu'il collecte | Identifiant de compte Runelio ; Whop collecte lui-même coordonnées et moyen de paiement | États-Unis | Transferts encadrés selon la politique de confidentialité de Whop (section « transferts internationaux ») — **conserver une copie datée** |

---

## Fiche 1 — Gestion des comptes et du service de préparation à la course

- **Finalité** : créer et gérer le compte, enregistrer le questionnaire, générer et afficher le programme, suivi des séances (réalisée, déplacée, ressenti), réajustements, lien d'agenda.
- **Base légale** : exécution du contrat (CGU/CGV).
- **Personnes concernées** : utilisateurs inscrits (18 ans ou plus, déclaration à l'inscription).
- **Données** :
  - compte : e-mail, prénom ou pseudo, empreinte du mot de passe (scrypt, jamais en clair), téléphone (facultatif), déclaration « 18 ans ou plus », vérification de l'e-mail, rôle, dates ;
  - questionnaire : objectif, date de course ou horizon, objectif chrono (facultatif), niveau, ancienneté, volume hebdomadaire, plus longue sortie, résultat de référence (facultatif), disponibilités, jours de repos, durée maximale de séance ;
  - suivi : programme généré, séances réalisées, séances déplacées, ressenti (facile / correct / difficile / trop difficile) ;
  - préférences : rappels e-mail activés ou non, jeton secret du lien d'agenda, date de dernière activité.
- **Données sensibles** : aucune. Pas de question médicale ; le ressenti se limite à un niveau de difficulté ; en cas de douleur, un message renvoie vers un professionnel **sans rien enregistrer**.
- **Destinataires** : l'éditeur ; Hostinger (hébergement).
- **Transfert hors UE** : non.
- **Durée de conservation** : jusqu'à la suppression du compte (possible à tout moment). Suppression automatique après **3 ans sans connexion**, après un e-mail d'avertissement 30 jours avant (sauf abonnement en cours ou compte administrateur) — tâche `/api/cron/maintenance`.
- **Prise de décision automatisée** : génération automatique du programme, sans effet juridique (art. 22 non applicable) ; l'utilisateur peut modifier ses réponses et réajuster.

## Fiche 2 — Gestion des abonnements et des paiements

- **Finalité** : souscription, suivi du statut de l'abonnement, renouvellements, échecs de paiement, résiliation, contrôle de l'accès au programme.
- **Base légale** : exécution du contrat.
- **Personnes concernées** : abonnés et personnes ayant démarré un paiement.
- **Données** : identifiants techniques Whop (abonnement, paiements), statut, montant, devise, dates d'échéance et de résiliation, motif d'échec éventuel, date d'acceptation des CGV et de la demande d'exécution immédiate (preuve), version des CGV acceptée. **Aucune donnée de carte bancaire** (saisie uniquement chez Whop).
- **Destinataires** : l'éditeur ; Hostinger ; Whop (identifiant de compte transmis à la création du paiement).
- **Transfert hors UE** : oui, vers Whop Inc. (États-Unis) — voir tableau des prestataires.
- **Durée de conservation** : données d'abonnement jusqu'à la suppression du compte ; journal technique des notifications de paiement (webhooks) **12 mois**, purge automatique ; pièces comptables 10 ans (fiche 3).

## Fiche 3 — Comptabilité

- **Finalité** : tenue de la comptabilité de la micro-entreprise (livre des recettes, reversements de Whop).
- **Base légale** : obligation légale (Code de commerce, Code général des impôts).
- **Données** : montants, dates, identifiants de paiement ; factures émises par l'éditeur sur demande du client (numéro, nom, e-mail, montant, date).
- **Destinataires** : l'éditeur ; le cas échéant son expert-comptable et l'administration fiscale.
- **Transfert hors UE** : non (hors données détenues par Whop).
- **Durée de conservation** : 10 ans à compter de la clôture de l'exercice, y compris après suppression du compte (les factures ne sont pas liées au compte).

## Fiche 4 — E-mails transactionnels et rappels

- **Finalité** : vérification de l'adresse e-mail, réinitialisation du mot de passe, confirmation de résiliation, **rappel environ 7 jours avant chaque renouvellement** (art. L215-1 C. conso.), rappel la veille des séances (si activé), avertissement avant suppression d'un compte inactif.
- **Base légale** : exécution du contrat ; obligation légale pour l'information avant renouvellement.
- **Données** : e-mail, prénom, date d'échéance, montant, séances du lendemain.
- **Destinataires** : l'éditeur ; Hostinger (messagerie).
- **Transfert hors UE** : **à confirmer** selon la localisation des serveurs de messagerie Hostinger.
- **Durée de conservation** : les e-mails envoyés ne sont pas stockés par l'application ; seules les dates d'envoi des rappels sont conservées (le temps du compte).

## Fiche 5 — Sécurité du service et prévention des abus

- **Finalité** : authentification, sessions, limitation des tentatives (connexion, inscription, mot de passe oublié), protection contre les abus.
- **Base légale** : intérêt légitime (protéger les comptes et le service).
- **Données** : sessions (adresse IP, navigateur/appareil, dates), compteurs anti-abus liés à l'IP ou au compte, jetons temporaires de vérification et de réinitialisation.
- **Destinataires** : l'éditeur ; Hostinger.
- **Transfert hors UE** : non.
- **Durée de conservation** : sessions 30 jours maximum ; lien de vérification 24 h ; lien de réinitialisation 30 min ; compteurs anti-abus quelques minutes.

## Fiche 6 — Actualités et offres par e-mail (prospection)

- **Statut** : prévu, aucun envoi à ce jour.
- **Finalité** : informer des nouveautés et offres de Runelio.
- **Base légale** : consentement (case facultative, non pré-cochée, retirable à tout moment).
- **Données** : e-mail, prénom, historique des consentements (date, choix, version du texte).
- **Destinataires** : l'éditeur ; Hostinger (messagerie).
- **Durée de conservation** : jusqu'au retrait du consentement ou à la suppression du compte. La preuve du consentement est conservée le temps du compte.
- **À faire avant le premier envoi** : n'écrire qu'aux comptes ayant consenti, lien de désinscription dans chaque e-mail.

## Fiche 7 — Gestion des demandes d'exercice des droits et des échanges

- **Finalité** : répondre aux demandes (accès, rectification, effacement, portabilité, opposition…) et aux messages des utilisateurs.
- **Base légale** : obligation légale (RGPD) ; intérêt légitime pour les autres échanges.
- **Données** : identité et e-mail du demandeur, objet de la demande, échanges, éventuel justificatif d'identité (en cas de doute raisonnable seulement).
- **Destinataires** : l'éditeur.
- **Durée de conservation** : le temps de traiter la demande, puis 5 ans pour la preuve de la réponse (prescription) ; le justificatif d'identité est supprimé dès la vérification faite.
- **Outils en autonomie** : modification du profil, export JSON, gestion du consentement et suppression du compte depuis « Compte ».

## Fiche 8 — Cadeaux du mois (tirages au sort)

- **Statut** : **inactif** (`GIVEAWAYS_ENABLED=false`). Ne pas activer avant validation du règlement et mise à jour de cette fiche.
- **Finalité** : organiser les tirages, désigner et contacter les gagnants, remettre les lots.
- **Base légale** : exécution du règlement accepté.
- **Données** : participations, tirage, gagnants, coordonnées de livraison éventuelles.
- **Durée de conservation** : à fixer dans le règlement.

---

## Mesures de sécurité (communes à tous les traitements)

- Mots de passe hachés (scrypt) ; connexions HTTPS uniquement ; cookies de session sécurisés.
- Vérification de l'e-mail obligatoire ; limitation des tentatives ; révocation des sessions après changement de mot de passe.
- Contrôle d'accès côté serveur sur chaque donnée ; programme jamais généré ni affiché sans abonnement confirmé.
- Notifications de paiement vérifiées par signature, traitées une seule fois.
- Politique de sécurité du contenu (CSP) ; aucun traceur ni outil tiers chargé dans le navigateur.
- Base de données non exposée sur Internet ; accès au serveur par clé SSH ; secrets dans un fichier `.env` hors du dépôt.
- **À mettre en place lors du déploiement** : sauvegardes chiffrées et testées de la base de données ; pare-feu (seuls les ports 80/443 et SSH ouverts).

---

## Registre des violations de données (art. 33.5 RGPD)

Toute violation (fuite, perte, accès non autorisé, piratage…) doit être consignée ici, **même si elle n'est pas notifiée**. Si elle présente un risque pour les personnes : notification à la CNIL **sous 72 heures** (notifications.cnil.fr) ; si le risque est élevé, information des personnes concernées.

| Date de découverte | Nature de la violation | Données et nombre de personnes concernées | Conséquences probables | Mesures prises | Notifiée à la CNIL (date) | Personnes informées (date) |
|---|---|---|---|---|---|---|
| — | Aucune à ce jour | — | — | — | — | — |

---

## Historique des mises à jour

| Date | Modification |
|---|---|
| 07/10/2026 | Création du registre (8 traitements). Ajout de la déclaration « 18 ans ou plus » et du rappel avant renouvellement. |
| 07/10/2026 | Whop requalifié en prestataire de paiement (l'éditeur est le vendeur). |
