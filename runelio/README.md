# Runelio — runelio.fr

SaaS français de préparation à la course à pied (5 km, 10 km, semi-marathon, marathon).
Inscription gratuite, génération du programme réservée aux abonnés (19,99 € par mois, paiement par Stripe).

> **État** : application fonctionnelle, testée localement, prête à être **configurée** pour la
> production. Elle n'est **pas** prête à être commercialisée tant que la configuration Stripe
> réelle, le prestataire e-mail, l'hébergement et les textes légaux n'ont pas été finalisés
> (voir [`docs/CHECKLIST-MISE-EN-LIGNE.md`](docs/CHECKLIST-MISE-EN-LIGNE.md)).
> Aucun paiement réel n'a été effectué pendant le développement : l'intégration Stripe est
> testée avec un faux client en mémoire et des webhooks signés localement (format Stripe).

## Stack et choix techniques

| Besoin | Choix | Pourquoi |
|---|---|---|
| Application web | **Next.js 16** (App Router, React 19, TypeScript strict) | Rendu serveur, routes API, un seul déploiement Node. |
| Base de données | **PostgreSQL 16** + **Drizzle ORM** / drizzle-kit | Typage de bout en bout, migrations SQL lisibles et versionnées, aucun binaire natif. |
| Authentification | **Better Auth** (e-mail + mot de passe) | Bibliothèque éprouvée : hachage **scrypt**, vérification d'e-mail, réinitialisation sécurisée, révocation de sessions, limitation de débit en base. Télémétrie désactivée. |
| Paiement | **Stripe** (SDK officiel `stripe` 23, API `2026-09-30.endive`) : Checkout, Billing, portail client | Pages de paiement et de gestion hébergées par Stripe, aucune donnée de carte chez Runelio. |
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
    billing.ts       checkout, webhooks idempotents, synchronisation Stripe, résiliation, portail, factures
    plans.ts         profil, génération, réajustement, suivi des séances
    giveaways.ts     cadeaux du mois avec garde-fous
    gdpr.ts          export des données, consentements
    stripe.ts        passerelle Stripe (interface PaymentGateway, remplaçable en test)
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

## Paiement : intégration Stripe

`docs.stripe.com` n'était pas accessible depuis l'environnement de développement. Les appels
utilisés ont été vérifiés dans les **types du SDK officiel `stripe` 23.0.0** (version d'API
`2026-09-30.endive`, épinglée dans `src/server/stripe.ts`).

| Besoin | Stripe | Implémentation Runelio |
|---|---|---|
| Paiement hébergé | Checkout Session `mode: subscription` | `startCheckout` : `client_reference_id` et `metadata.runelio_user_id` (session et abonnement) relient l'achat au compte ; client Stripe réutilisé en cas de réabonnement ; aucune taxe calculée (`automatic_tax` désactivé, franchise de TVA). |
| Événements signés | En-tête `Stripe-Signature`, secret `whsec_…`, tolérance 5 min | Route `/api/webhooks/stripe` : `constructEvent` sur le corps brut, journal `webhook_event` (idempotence par identifiant d'événement), état relu via `subscriptions.retrieve`. Erreur → 500 pour que Stripe réessaie. |
| Statut d'abonnement | `active, trialing, past_due, canceled, unpaid, incomplete, incomplete_expired, paused` | `access.ts` : accès complet `active/trialing` (jusqu'à la fin de période si résiliation programmée) ; `past_due` = lecture seule ; le reste = aucun accès. |
| Fin de période | Portée par l'élément d'abonnement (`items.data[].current_period_end`) depuis l'API 2025-03-31 | `toGatewaySubscription` ; une résiliation datée (`cancel_at`) est aussi prise en compte. |
| Résiliation / annulation | `subscriptions.update({ cancel_at_period_end })`, `subscriptions.cancel` | Bouton dans Facturation + lien permanent `/resiliation`, e-mail de confirmation ; suppression du compte = résiliation immédiate. |
| Moyen de paiement, factures | Portail client (`billingPortal.sessions.create`) | Bouton « Gérer mon moyen de paiement et mes factures ». |
| Factures | Factures Stripe Billing (numérotation Stripe) | À configurer dans Stripe (mentions légales, 293 B). Générateur du site désactivé (`INVOICES_ENABLED=false`). |
| Prix affiché = prix payé | Prix récurrent mensuel | Page Admin → « Vérifier maintenant » compare le prix Stripe au prix affiché. |

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
- Export JSON des données, suppression du compte (résilie l'abonnement Stripe d'abord),
  consentement facultatif aux e-mails d'actualités journalisé.
- Aucune donnée médicale demandée.

## Déploiement (Hostinger)

Guide pas à pas pour débutant : [`docs/INSTALLATION-VPS.md`](docs/INSTALLATION-VPS.md)
(VPS Ubuntu + Docker : PostgreSQL, application et HTTPS automatique via Caddy).

Résumé :

```bash
cp .env.example .env    # puis compléter (NEXT_PUBLIC_APP_URL=https://runelio.fr, POSTGRES_PASSWORD, BETTER_AUTH_SECRET, Stripe, SMTP)
docker compose up -d --build
docker compose run --rm migrate
```

Liste complète avant ouverture : [`docs/CHECKLIST-MISE-EN-LIGNE.md`](docs/CHECKLIST-MISE-EN-LIGNE.md).
Registre RGPD des traitements (document interne) : [`docs/REGISTRE-TRAITEMENTS.md`](docs/REGISTRE-TRAITEMENTS.md).
