# Runelio — runelio.fr

SaaS français de préparation à la course à pied (5 km, 10 km, semi-marathon, marathon).
Inscription gratuite, génération du programme réservée aux abonnés (19,99 € tous les 30 jours via Whop).

> **État** : application fonctionnelle, testée localement, prête à être **configurée** pour la
> production. Elle n'est **pas** prête à être commercialisée tant que la configuration Whop
> réelle, le prestataire e-mail, l'hébergement et les textes légaux n'ont pas été finalisés
> (voir [`docs/CHECKLIST-MISE-EN-LIGNE.md`](docs/CHECKLIST-MISE-EN-LIGNE.md)).
> Aucun paiement réel n'a été effectué pendant le développement : l'intégration Whop est
> testée avec un faux client en mémoire et des webhooks signés localement.

## Stack et choix techniques

| Besoin | Choix | Pourquoi |
|---|---|---|
| Application web | **Next.js 16** (App Router, React 19, TypeScript strict) | Rendu serveur, routes API, un seul déploiement Node. |
| Base de données | **PostgreSQL 16** + **Drizzle ORM** / drizzle-kit | Typage de bout en bout, migrations SQL lisibles et versionnées, aucun binaire natif. |
| Authentification | **Better Auth** (e-mail + mot de passe) | Bibliothèque éprouvée : hachage **scrypt**, vérification d'e-mail, réinitialisation sécurisée, révocation de sessions, limitation de débit en base. Télémétrie désactivée. |
| Paiement | **Whop** (API v1 REST + `unwrapWebhook` du SDK officiel `@whop/sdk`) | Page de paiement hébergée, aucune donnée de carte chez Runelio. |
| E-mails | **SMTP** (nodemailer) | Indépendant du prestataire, qui reste à choisir. |
| Style | **Tailwind CSS 4**, polices **auto-hébergées** (Fontsource) | Aucun appel à Google Fonts (pas de transfert de données). |
| Tests | **Vitest** + **PGlite** (PostgreSQL en mémoire) | Les tests exécutent les vraies migrations sans serveur externe. |

### Architecture

```
src/
  domain/            logique pure (sans I/O)
    planning/        planificateur course à pied (types, running.ts)
    sports.ts        registre des disciplines (triathlon modélisé mais NON disponible)
  server/            services serveur
    access.ts        règles d'accès liées à l'abonnement (pures, testées)
    billing.ts       checkout, webhooks idempotents, synchronisation Whop, résiliation, factures
    plans.ts         profil, génération, réajustement, suivi des séances
    giveaways.ts     cadeaux du mois avec garde-fous
    gdpr.ts          export des données, consentements
    whop.ts          client HTTP Whop (interface WhopGateway, remplaçable en test)
    auth.ts          configuration Better Auth
  app/               pages et routes API (Next.js)
  db/schema.ts       schéma Drizzle ; migrations dans drizzle/
tests/               tests Vitest
```

**Triathlon / Ironman** : les objectifs existent dans le schéma (`sport`, `race_goal`) et le
registre `src/domain/sports.ts`, mais `SPORTS.triathlon.available = false`. Pour les ouvrir,
il faudra implémenter un planificateur natation + vélo + course et l'enregistrer : l'interface
ne liste que les objectifs des disciplines disponibles.

## Lancer en local

Prérequis : Node.js ≥ 20.9, PostgreSQL ≥ 14.

```bash
cd runelio
cp .env.example .env               # puis renseigner DATABASE_URL et BETTER_AUTH_SECRET
npm install
npm run db:migrate                 # applique drizzle/*.sql
npm run db:seed                    # données de démonstration (facultatif)
npm run dev                        # http://localhost:3000
```

Comptes de démonstration (mot de passe `demo-runelio-2026`) :
`demo@runelio.test` (gratuit), `abonne@runelio.test` (abonnement **fictif** + programme),
`admin@runelio.test` (administrateur). Sans SMTP, les e-mails (vérification, mot de passe)
s'affichent dans la console du serveur.

Autres commandes :

```bash
npm test               # tests Vitest (planification, accès, paiement, webhooks, routes)
npm run lint           # ESLint
npm run typecheck      # types Next.js + tsc
npm run build          # build de production (sortie standalone)
npm run db:generate    # nouvelle migration après modification de src/db/schema.ts
npm run admin:grant -- vous@exemple.fr   # donner le rôle administrateur
```

## Paiement : ce qui a été vérifié chez Whop

`docs.whop.com` n'était pas accessible depuis l'environnement de développement. Les
capacités ci-dessous ont été vérifiées dans le **SDK officiel `@whop/sdk` 2.0.0**
(types générés depuis l'OpenAPI Whop, version d'API `2026-09-23`), complétées par les pages
publiques de documentation indexées. À revérifier sur votre tableau de bord Whop.

| Besoin | Disponible chez Whop ? | Implémentation Runelio |
|---|---|---|
| Paiement hébergé | Oui : `POST /checkout_configurations` → `purchase_url` ; `metadata` recopiées sur paiements et memberships | `startCheckout` : `metadata.runelio_user_id` relie l'achat au compte. |
| Événements signés | Oui : Standard Webhooks (`webhook-id`, `webhook-timestamp`, `webhook-signature`), secret `ws_…` | Route `/api/webhooks/whop` : vérification sur le corps brut avec `unwrapWebhook`, fenêtre de temps, journal `webhook_event` (idempotence), état relu via `GET /memberships/{id}`. Erreur → 500 pour que Whop réessaie. |
| Statut d'abonnement | Oui : `trialing, active, past_due, completed, canceled, expired, unresolved, drafted, canceling` | `access.ts` : accès complet `active/trialing/canceling` ; `past_due` = lecture seule ; le reste = aucun accès. |
| Résiliation | Oui : `POST /memberships/{id}/cancel` (`cancel_at_period_end`) | Bouton dans Facturation + lien permanent `/resiliation`, e-mail de confirmation. |
| Annuler une résiliation | Oui : `PATCH /memberships/{id}` avec `cancel_at_period_end: false` | Bouton « Annuler la résiliation ». |
| Modifier le moyen de paiement | **Pas d'API** pour le faire depuis un site tiers | Limite : lien vers l'espace client Whop (`whop.com/@me/settings/memberships`) avec explications. |
| Factures conformes au droit français | **Non vérifié** : l'API `invoices` de Whop sert à facturer des clients, pas à produire les factures de l'abonnement ; Whop envoie des reçus | Solution : factures émises par Runelio (numérotation continue, mention 293 B), **désactivées par défaut** (`INVOICES_ENABLED=false`) tant que le rôle fiscal de Whop n'est pas confirmé (si Whop agit en « merchant of record », c'est lui qui facture). |
| Prix affiché = prix payé | À contrôler : un plan Whop peut avoir `collect_tax`, `tax_type`, tarification adaptative, frais acheteur | Page Admin → « Vérifier maintenant » compare le plan Whop au prix affiché. |
| Mensualité calendaire | **Non** : `billing_period` est exprimé en **jours** | Le site affiche honnêtement « 19,99 € tous les 30 jours ». |

## Sécurité et données

- Mots de passe : scrypt (Better Auth), 10 caractères minimum, jamais en clair.
- E-mail vérifié obligatoire avant toute utilisation ; réinitialisation par lien de 30 min ; les
  sessions sont révoquées après changement/réinitialisation du mot de passe.
- Anti-abus : limitation de débit Better Auth (connexion 5/min, inscription et e-mails 3–5/5 min)
  stockée en base + limiteur applicatif (checkout, génération, export).
- Toutes les routes mutantes vérifient la session, l'origine (`Origin`) et la propriété de la
  ressource ; les routes admin exigent le rôle `admin`.
- CSP avec nonce par requête (`src/proxy.ts`), en-têtes de sécurité, HSTS en production.
- Aucun traceur non essentiel : pas de bandeau affiché tant qu'aucun n'est déclaré dans
  `src/lib/consent.ts` ; `<ConsentGate>` bloque tout script facultatif avant accord.
- Export JSON des données, suppression du compte (résilie l'abonnement Whop d'abord),
  consentement facultatif aux e-mails d'actualités journalisé.
- Aucune donnée médicale demandée.

## Déploiement (Hostinger)

Guide pas à pas pour débutant : [`docs/INSTALLATION-VPS.md`](docs/INSTALLATION-VPS.md)
(VPS Ubuntu + Docker : PostgreSQL, application et HTTPS automatique via Caddy).

Résumé :

```bash
cp .env.example .env    # puis compléter (NEXT_PUBLIC_APP_URL=https://runelio.fr, POSTGRES_PASSWORD, BETTER_AUTH_SECRET, Whop, SMTP)
docker compose up -d --build
docker compose run --rm migrate
```

Liste complète avant ouverture : [`docs/CHECKLIST-MISE-EN-LIGNE.md`](docs/CHECKLIST-MISE-EN-LIGNE.md).
Registre RGPD des traitements (document interne) : [`docs/REGISTRE-TRAITEMENTS.md`](docs/REGISTRE-TRAITEMENTS.md).
