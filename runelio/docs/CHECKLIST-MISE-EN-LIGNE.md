# Checklist avant mise en ligne de runelio.fr

Chaque point doit être vérifié et coché. Les marqueurs `[À COMPLÉTER : …]` / `[À VÉRIFIER : …]`
apparaissent en surbrillance jaune dans les pages légales du site : il ne doit en rester aucun.
Commande pour les retrouver : `grep -rn "Todo\|Verify\|À VALIDER" src/app src/components`.

## Décisions de l'éditeur (30/09/2026)
- Franchise en base de TVA : confirmée. Activité déclarée : confirmée.
- Whop agit comme **merchant of record** : Whop vend, encaisse, applique la TVA et facture. `INVOICES_ENABLED` reste à `false`.
- Formulation de la rétractation : validée. Pas d'âge minimum. Pas de téléphone dans les mentions légales (voir risque ci-dessous).
- Conservation des comptes inactifs : sans limite automatique (voir risque ci-dessous).
- Prestataires : Hostinger (hébergement et messagerie), Whop.

**Risques signalés à l'éditeur :**
- Le **médiateur de la consommation** est obligatoire avant de vendre à des particuliers.
- La loi (LCEN art. 6 III ; Code de la consommation, art. R111-1) prévoit un **numéro de téléphone** pour l'éditeur et le vendeur à distance : l'absence de numéro expose à une sanction.
- Le RGPD impose une **durée de conservation limitée** : l'absence de limite pour les comptes inactifs n'est pas conforme (la CNIL recommande souvent 2 à 3 ans d'inactivité).
- Avec Whop merchant of record, le plan doit être configuré **TVA incluse** pour que le client paie exactement 19,99 € TTC.

## Avancement (03/10/2026)
| Étape | État |
|---|---|
| 1. Ancienne clé API Whop supprimée | ✅ Fait |
| 2. Fiscalité (franchise TVA, activité, Whop merchant of record) | ✅ Confirmé |
| 3. Configuration Whop (plan, webhook, tests) | ⏳ En attente de la mise en ligne |
| 4. Hébergement Hostinger, serveur à Paris | ✅ Choisi — installation à faire |
| 5. E-mails : messagerie Hostinger | ✅ Choisi — SPF/DKIM/DMARC à configurer |
| 6. Juridique (médiateur, téléphone, durée de conservation…) | ⏳ Plus tard — **à régler avant la première vente** |
| 7. Cadeaux du mois | ✅ Désactivés pour le lancement (`GIVEAWAYS_ENABLED=false`) |
| 8. Contrôles techniques finaux | ⏳ Après l'installation |

## 1. Statut de l'éditeur et fiscalité
- [ ] Confirmer le bénéfice de la **franchise en base de TVA** (seuils de chiffre d'affaires de l'année en cours et précédente) et la mention exacte `TVA non applicable, art. 293 B du CGI` (`src/lib/config.ts`).
- [ ] Vérifier que l'activité déclarée de la micro-entreprise couvre la vente d'abonnements en ligne ; indiquer le registre d'immatriculation (RNE / RCS) dans les mentions légales.
- [ ] Ajouter un **numéro de téléphone** de contact (mentions légales).
- [ ] Adhérer à un **médiateur de la consommation** (obligatoire pour la vente aux consommateurs) et l'indiquer dans les CGV.
- [ ] Déterminer avec un expert-comptable si **Whop agit comme vendeur (« merchant of record »)** ou comme simple prestataire de paiement :
  - s'il est merchant of record : c'est lui qui facture le client et collecte la TVA éventuelle → adapter l'affichage du prix, les CGV et laisser `INVOICES_ENABLED=false` ;
  - sinon : l'éditeur facture → compléter les mentions obligatoires de la facture (`src/app/api/invoices/[id]/route.ts`), puis `INVOICES_ENABLED=true`.
- [ ] Vérifier sur une vraie page de paiement Whop que le client paie **exactement 19,99 €** : pas de taxe ajoutée (`tax_type` ≠ exclusive), pas de frais acheteur, pas de conversion de devise (page Admin → « Vérifier maintenant »).

## 2. Whop
- [ ] Créer le produit et un **plan récurrent** : 19,99 EUR, `billing_period` 30 jours, sans essai gratuit, prix initial = prix de renouvellement.
- [ ] Créer une clé API avec les permissions nécessaires (checkout configurations, memberships lecture + gestion, plans, paiements) ; renseigner `WHOP_API_KEY`, `WHOP_COMPANY_ID`, `WHOP_PLAN_ID`.
- [ ] Déclarer le webhook `https://runelio.fr/api/webhooks/whop` avec les événements `membership.activated`, `membership.deactivated`, `membership.cancel_at_period_end_changed`, `payment.succeeded`, `payment.failed`, `payment.pending`, `payment.canceled` ; copier le secret `ws_…` dans `WHOP_WEBHOOK_SECRET`.
- [ ] Tester le parcours complet dans le **bac à sable Whop** (`WHOP_API_BASE_URL=https://sandbox-api.whop.com/api/v1`) : paiement réussi, refusé, abandonné, résiliation, annulation de résiliation, renouvellement, échec de renouvellement.
- [ ] Vérifier que la redirection `redirect_url` renvoie bien vers `/abonnement/retour`.
- [ ] Vérifier la durée des relances après échec de paiement et la mettre à jour dans les CGV.
- [ ] Obtenir auprès de Whop : entité contractante, rôle RGPD (sous-traitant / responsable distinct), DPA, localisation des données et mécanisme d'encadrement des transferts hors UE ; compléter la politique de confidentialité.
- [ ] Vérifier que les e-mails de reçu Whop sont en français ou acceptables pour la clientèle.

## 3. Hébergement (Hostinger)
- [ ] Choisir une offre compatible **Node.js + PostgreSQL** (VPS recommandé ; les offres mutualisées ne proposent en général que MySQL).
- [ ] Choisir un **centre de données dans l'UE**, noter l'entité Hostinger contractante et son adresse, signer/accepter le DPA.
- [ ] HTTPS (Let's Encrypt) via reverse-proxy ; redirection HTTP → HTTPS ; `NEXT_PUBLIC_APP_URL=https://runelio.fr`.
- [ ] Sauvegardes chiffrées et testées de PostgreSQL ; accès SSH par clé ; pare-feu (seuls 80/443 exposés).
- [ ] `BETTER_AUTH_SECRET` fort et unique ; `.env` hors du dépôt.
- [ ] Si un proxy/CDN est placé devant l'application, configurer Better Auth pour lire la bonne IP client (`advanced.ipAddress`) afin que la limitation de débit fonctionne.

## 4. E-mails
- [ ] Choisir le **prestataire SMTP** (localisation UE de préférence), configurer SPF, DKIM et DMARC pour runelio.fr, renseigner `SMTP_*` et `MAIL_FROM`.
- [ ] Tester : vérification d'e-mail, réinitialisation du mot de passe, confirmation de résiliation.
- [ ] Si des e-mails d'actualités sont envoyés : n'écrire qu'aux comptes ayant consenti (`consent_log`), ajouter un lien de désinscription dans chaque e-mail.

## 5. Juridique
- [ ] Faire relire les 5 documents (mentions légales, confidentialité, CGU/CGV, cookies, règlement) et supprimer tous les marqueurs.
- [ ] Valider la formulation de la case « exécution immédiate / perte du droit de rétractation » (`src/components/space/checkout-form.tsx`) et la qualification du service (contenu numérique / service).
- [ ] Vérifier l'obligation d'information préalable à la reconduction (art. L215-1 C. conso.) pour un abonnement de 30 jours.
- [ ] Vérifier la conformité du parcours de résiliation en ligne (« en trois clics ») : lien `/resiliation` visible sur toutes les pages, confirmation par e-mail avec date d'effet.
- [ ] Définir l'**âge minimum** et, si nécessaire, ajouter une case de déclaration d'âge à l'inscription.
- [ ] Définir les durées de conservation manquantes (comptes inactifs, journal des webhooks) et implémenter la purge automatique correspondante (non implémentée à ce jour).
- [ ] Tenir le **registre des traitements** (RGPD, art. 30) à partir de la politique de confidentialité.
- [ ] Confirmer que les données d'entraînement collectées ne sont pas des données de santé au sens de l'article 9 RGPD ; ne pas ajouter de question médicale sans analyse préalable (finalité, base légale, garanties, éventuel hébergeur HDS).

## 6. Cadeaux du mois
- [ ] Laisser `GIVEAWAYS_ENABLED=false` tant que les points ci-dessous ne sont pas faits.
- [ ] Définir lots, valeurs, calendrier, critères de participation et modalités du tirage.
- [ ] Faire valider le dispositif au regard du droit français (loteries : art. L322-1 s. du Code de la sécurité intérieure et L121-20 du Code de la consommation ; lien avec l'abonnement payant ; participation gratuite éventuelle ; fiscalité des lots).
- [ ] Rédiger et publier le règlement définitif (`src/app/legal/reglement-cadeaux/page.tsx`), éventuellement le déposer auprès d'un commissaire de justice.
- [ ] Dans l'admin : créer le cadeau, renseigner la version du règlement, attester la validation, puis ouvrir les participations.

## 7. Cookies et traceurs
- [ ] Vérifier dans le navigateur, en production, la liste exacte des cookies déposés et mettre à jour `/legal/cookies`.
- [ ] Tout nouvel outil (analytics, pixel, chat…) : le déclarer dans `src/lib/consent.ts`, le charger via `<ConsentGate>`, mettre à jour la politique cookies et la politique de confidentialité.

## 8. Contrôles techniques finaux
- [ ] `npm run check` (lint + types + tests) et `npm run build` sans erreur.
- [ ] `npm run db:migrate` sur la base de production.
- [ ] Créer votre compte, puis `npm run admin:grant -- votre@email`.
- [ ] Ne **pas** exécuter `npm run db:seed` en production (le script refuse de toute façon).
- [ ] Tester sur mobile (iOS Safari, Android Chrome) et au clavier seul.
