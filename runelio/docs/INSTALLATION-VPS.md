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
nano .env
```
Dans l'éditeur `nano`, modifie ces lignes (flèches pour se déplacer) :
```
NEXT_PUBLIC_APP_URL=https://runelio.fr
WHOP_API_KEY=            ← ta NOUVELLE clé apik_…
WHOP_COMPANY_ID=         ← biz_…
WHOP_PLAN_ID=            ← plan_…
WHOP_WEBHOOK_SECRET=     ← ws_… (étape 9, tu peux le remplir plus tard)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@runelio.fr      ← une boîte mail créée dans hPanel
SMTP_PASSWORD=                      ← son mot de passe
MAIL_FROM="Runelio <no-reply@runelio.fr>"
```
Les lignes `BETTER_AUTH_SECRET` et `POSTGRES_PASSWORD` ont été ajoutées automatiquement à la fin : n'y touche pas. Laisse `DATABASE_URL` tel quel : il est remplacé automatiquement.
Enregistre : **Ctrl + O**, Entrée, puis **Ctrl + X**.

> Vérifie les réglages SMTP exacts dans hPanel → E-mails → ta boîte → « Configurer les appareils ».

## Étape 7 — Démarrer le site
```bash
docker compose up -d --build
docker compose run --rm migrate
```
La première commande prend plusieurs minutes. La seconde crée les tables de la base de données.
Contrôle : `docker compose ps` → les services `db`, `app` et `caddy` doivent être « running ».

Ouvre **https://runelio.fr** : le site s'affiche avec le cadenas 🔒 (le certificat HTTPS est obtenu automatiquement si l'étape 2 est propagée).

## Étape 8 — Créer ton compte administrateur
1. Sur le site, crée ton compte et confirme ton e-mail.
2. Dans le terminal :
```bash
docker compose run --rm migrate npm run admin:grant -- ton@email.fr
```

## Étape 9 — Brancher Whop
1. Whop → Développeur → **Créer un webhook** : URL `https://runelio.fr/api/webhooks/whop`, événements `membership.activated`, `membership.deactivated`, `membership.cancel_at_period_end_changed`, `payment.succeeded`, `payment.failed`, `payment.pending`, `payment.canceled`.
2. Copie le secret `ws_…` dans `.env` (`nano .env`), puis relance :
```bash
docker compose up -d
```
3. Sur le site → page **Admin** → **Vérifier maintenant** : toutes les lignes doivent être vertes.
4. Fais un achat de test, puis une résiliation.

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
