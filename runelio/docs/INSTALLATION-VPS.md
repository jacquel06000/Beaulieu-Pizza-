# Installer Runelio sur un VPS Hostinger — pas à pas

Durée : 1 à 2 heures la première fois. Chaque bloc gris est à **copier-coller** dans le terminal, puis touche Entrée.

---

## Étape 1 — Acheter le VPS
1. hostinger.fr → **VPS** → une offre KVM (KVM 2 recommandée).
2. Emplacement : **France (Paris)**. Système : **Ubuntu 24.04** (ou « Ubuntu avec Docker » s'il est proposé).
3. Choisis un **mot de passe root** très solide et garde-le dans ton gestionnaire de mots de passe.
4. Note l'**adresse IP** du VPS (affichée dans hPanel, ex. `123.45.67.89`).

## Étape 2 — Faire pointer runelio.fr vers le VPS
Dans hPanel → **Domaines** → runelio.fr → **DNS / Serveurs de noms** :
- enregistrement **A**, nom `@`, valeur = l'IP du VPS ;
- enregistrement **A**, nom `www`, valeur = l'IP du VPS ;
- supprime les anciens enregistrements A ou CNAME `@` / `www` qui pointent ailleurs.

La propagation peut prendre de quelques minutes à quelques heures.

## Étape 3 — Ouvrir le terminal du VPS
hPanel → **VPS** → ton serveur → bouton **Terminal du navigateur** (ou, depuis ton Mac : `ssh root@IP_DU_VPS`).

## Étape 4 — Préparer le serveur
```bash
apt update && apt upgrade -y
apt install -y git ufw
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw --force enable
```
Si tu n'as pas choisi le modèle « Ubuntu avec Docker », installe Docker :
```bash
curl -fsSL https://get.docker.com | sh
```
Vérifie : `docker --version` doit afficher un numéro de version.

## Étape 5 — Récupérer le code
```bash
cd /opt
git clone --branch claude/awesome-fermat-rtekoc https://github.com/jacquel06000/Beaulieu-Pizza-.git runelio-src
cd /opt/runelio-src/runelio
```
Si le dépôt est privé, GitHub te demandera un identifiant : utilise ton nom d'utilisateur et un **jeton d'accès** (GitHub → Settings → Developer settings → Personal access tokens), pas ton mot de passe.

## Étape 6 — Créer le fichier de réglages `.env`
```bash
cp .env.example .env
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 48)" >> .env
echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)" >> .env
echo "CRON_SECRET=$(openssl rand -hex 24)" >> .env
nano .env
```
Dans l'éditeur `nano`, modifie ces lignes (flèches pour se déplacer) :
```
NEXT_PUBLIC_APP_URL=https://runelio.fr
STRIPE_SECRET_KEY=       ← sk_test_… pour les essais, puis sk_live_… (étape 9)
STRIPE_PRICE_ID=         ← price_… (étape 9)
STRIPE_WEBHOOK_SECRET=   ← whsec_… (étape 9, tu peux le remplir plus tard)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contact@runelio.fr       ← la boîte mail créée dans hPanel
SMTP_PASSWORD=                      ← son mot de passe
MAIL_FROM="Runelio <contact@runelio.fr>"
```
Les lignes `BETTER_AUTH_SECRET`, `POSTGRES_PASSWORD` et `CRON_SECRET` ont été ajoutées automatiquement à la fin : n'y touche pas. Laisse `DATABASE_URL` tel quel : il est remplacé automatiquement.
Enregistre : **Ctrl + O**, Entrée, puis **Ctrl + X**.

> Vérifie les réglages SMTP exacts dans hPanel → E-mails → ta boîte → « Configurer les appareils ».

## Étape 7 — Démarrer le site
```bash
docker compose up -d --build
docker compose run --rm migrate
```
La première commande prend plusieurs minutes. La seconde crée les tables de la base de données.
Contrôle : `docker compose ps` → les services `db`, `app`, `cron` et `caddy` doivent être « running ».

Ouvre **https://runelio.fr** : le site s'affiche avec le cadenas 🔒 (le certificat HTTPS est obtenu automatiquement si l'étape 2 est propagée).

## Étape 8 — Créer ton compte administrateur
1. Sur le site, crée ton compte et confirme ton e-mail.
2. Dans le terminal :
```bash
docker compose run --rm migrate npm run admin:grant -- ton@email.fr
```

## Étape 9 — Brancher Stripe
Commence en **mode test** (interrupteur « Mode test » en haut du Dashboard Stripe) : rien n'est réellement débité.

1. **Produit et prix** : Catalogue de produits → Ajouter un produit « Abonnement Runelio » → prix **19,99 EUR**, **récurrent**, **mensuel**. Copie l'identifiant `price_…` dans `STRIPE_PRICE_ID`.
2. **Clé secrète** : Développeurs → Clés API → copie la clé secrète `sk_test_…` dans `STRIPE_SECRET_KEY`. Ne la donne à personne (ni à Claude).
3. **Webhook** : Développeurs → Webhooks → Ajouter une destination → URL `https://runelio.fr/api/webhooks/stripe`, événements :
   `checkout.session.completed`, `checkout.session.expired`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`, `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`.
   Copie le secret de signature `whsec_…` dans `STRIPE_WEBHOOK_SECRET`.
4. **Portail client** : Paramètres → Billing → Portail client → activer « mettre à jour le moyen de paiement » et « historique des factures ».
5. **Relances** : Paramètres → Billing → Abonnements et e-mails → nouvelles tentatives pendant **2 semaines maximum**, puis **annuler l'abonnement** ; activer les e-mails aux clients en cas d'échec de paiement et les reçus de paiement.
6. **Factures** : Paramètres → Billing → Factures → renseigner ton nom, ton adresse, ton SIRET et, en pied de page, `TVA non applicable, art. 293 B du CGI`.
7. **TVA** : ne pas activer Stripe Tax (franchise en base de TVA).
8. Relance le site :
```bash
docker compose up -d
```
9. Sur le site → page **Admin** → **Vérifier maintenant** : toutes les lignes doivent être vertes.
10. Fais un achat de test avec la carte `4242 4242 4242 4242` (date future, n'importe quel code), puis une résiliation et un changement de carte.
11. Quand tout fonctionne : refais les étapes 1 à 3 en **mode production** (clés `sk_live_…`, nouveau `price_…`, nouveau webhook `whsec_…`), mets-les dans `.env` et relance.

## Mettre à jour le site plus tard
```bash
cd /opt/runelio-src && git pull
cd runelio && docker compose up -d --build && docker compose run --rm migrate
```

## En cas de problème
- Voir les messages du site : `docker compose logs app --tail 100`
- Voir les messages HTTPS : `docker compose logs caddy --tail 50`
- Redémarrer : `docker compose restart`

## Sauvegarde de la base (à faire régulièrement)
```bash
docker compose exec db pg_dump -U runelio runelio | gzip > /root/runelio-$(date +%F).sql.gz
```
Copie ensuite ce fichier hors du VPS (ou active les sauvegardes automatiques du VPS dans hPanel).
