# Maison des Pâtes Saint-Charles — site vitrine

Site vitrine complet pour **Maison des Pâtes Saint-Charles**, restaurant de
pâtes fraîches artisanales, 14 avenue Saint-Charles, 98000 Monaco.

## Stack

HTML5 / CSS3 / JavaScript vanilla, sans build ni dépendance à installer :
il fonctionne immédiatement, sur n'importe quel hébergement statique.
Deux dépendances externes chargées par CDN : **Google Fonts** (Fraunces +
Inter) et **Lucide Icons** (icônes de l'interface).

## Structure

```
maison-des-pates-saint-charles/
├── index.html          Accueil (hero, maison en bref, carte en bref,
│                        savoir-faire, horaires, contact & localisation)
├── la-maison.html       La Maison — l'esprit, le geste, les ingrédients
├── nos-pates.html        La carte complète (pâtes, sauces, desserts, boissons)
├── robots.txt / sitemap.xml
└── assets/
    ├── css/styles.css    Design system complet (couleurs, typo, composants)
    ├── favicon.svg
    └── js/
        ├── site-data.js  ★ DONNÉES — téléphone, adresse, horaires, carte
        ├── i18n.js        ★ TEXTES — français / anglais / italien
        └── main.js        Logique : traduction, rendu de la carte,
                            horaires en direct, navigation, animations
```

## ⚠️ Où modifier le contenu

Le site est piloté par **deux fichiers**, jamais par les pages HTML :

| Pour changer…                                   | Modifiez dans…            |
|--------------------------------------------------|----------------------------|
| Téléphone affiché / lien d'appel                 | `SITE.phoneDisplay` / `SITE.phoneHref` (site-data.js) |
| Adresse, requête utilisée pour Google Maps        | `SITE.address` (site-data.js) |
| Horaires (jours, heures d'ouverture/fermeture)    | `SITE.hours` (site-data.js) |
| **La carte : plats, catégories, prix**            | `SITE.menu` (site-data.js) — *carte actuellement en vigueur, transcrite de la carte affichée en salle* |
| Compte Instagram (masqué si vide)                 | `SITE.social.instagram` (site-data.js) |
| Tous les textes, en FR / EN / IT                  | `I18N.fr` / `I18N.en` / `I18N.it` (i18n.js) |
| Le libellé des jours, « Ouvert »/« Fermé »        | `I18N.<langue>.days` / `.hoursWidget` (i18n.js) |

La carte (`nos-pates.html`) est **entièrement générée depuis
`SITE.menu`** : ajouter, retirer ou repositionner un plat, changer un prix,
se fait uniquement dans `site-data.js` — aucune modification du HTML ou du
CSS n'est nécessaire, et le rendu reste identique dans les 3 langues.

## Langues

Le site est traduit intégralement en **français, anglais et italien**. Le
sélecteur (drapeaux) est en haut à droite ; la langue choisie est mémorisée
(le visiteur la retrouve à sa prochaine visite) et, par défaut, le site
s'ouvre dans la langue du navigateur si elle est disponible, sinon en
français. Les noms des plats restent identiques dans les 3 langues, comme
sur la carte réelle affichée en salle — seuls les titres de section, les
libellés et les textes éditoriaux sont traduits.

**Limite à connaître** : la traduction s'applique après chargement, côté
navigateur. Le premier chargement (et ce que voient les robots des moteurs
de recherche) reste en français. Pour un référencement indexé séparément
par langue, il faudrait des URL dédiées par langue (`/en/`, `/it/`) — une
évolution possible, plus lourde que ce sélecteur.

## Design

- **Palette** : ivoire/farine en fond, terracotta et vert sauge en accents,
  brun profond pour le texte, touches dorées très discrètes. Variables
  CSS en tête de `assets/css/styles.css` (`:root`).
- **Typographie** : Fraunces (serif, titres) + Inter (sans-serif, texte).
- **Illustrations** : le site n'utilise volontairement aucune photo de
  stock générique — les visuels sont des illustrations vectorielles
  (traits fins, motifs pâtes/olivier) pour rester sobre et distinctif tant
  que de vraies photographies du restaurant ne sont pas disponibles.
  Pour ajouter de vraies photos : déposez-les dans `assets/img/` et
  remplacez les blocs `.pasta-plate`, `.feature-art`, `.story-art` par des
  balises `<img>` dans le HTML concerné.
- **Animations** : apparition progressive au défilement (`IntersectionObserver`,
  classe `.reveal`), légers mouvements au survol, transitions fluides.
  Désactivées automatiquement si `prefers-reduced-motion: reduce`.

## Horaires en direct

La section « Horaires » (et le pied de page) affiche un badge « Ouvert /
Fermé » calculé en direct depuis `SITE.hours`, dans le fuseau horaire du
visiteur. Aucune donnée n'est inventée : ce badge reflète exactement les
horaires renseignés dans `site-data.js`.

## Lancer le site en local

Sans Node ni Python disponibles sur cette machine, le plus simple est
d'ouvrir `index.html` directement dans un navigateur, ou d'utiliser
l'extension « Live Server » de votre éditeur. Sur une machine avec Node :

```bash
npx serve .
```

## Déployer

Le site est 100 % statique : il se dépose tel quel sur Netlify, Vercel
(« static site »), GitHub Pages, ou tout hébergement mutualisé classique.
Avant mise en ligne :
1. Remplacer `https://www.maison-des-pates-saintcharles.mc/` (domaine
   provisoire) par le vrai nom de domaine dans les balises `canonical` /
   `og:*` de chaque page HTML, ainsi que dans `sitemap.xml` et `robots.txt`.
2. Le cas échéant, ajouter les mentions légales (SIRET / immatriculation,
   hébergeur, directeur de publication) — aucune n'a été renseignée ici
   faute d'information fournie.
3. Remplacer les illustrations par de vraies photographies si souhaité
   (voir section Design ci-dessus).

## Ce qui a été implémenté

- Header sticky avec navigation, menu mobile plein écran, CTA « Nous appeler »
- **Sélecteur de langue (FR/EN/IT) avec drapeaux, traduction complète du
  site, choix mémorisé**
- Hero avec accroche, double CTA (appel + itinéraire Google Maps)
- Présentation de la maison, mise en avant de la carte, savoir-faire familial
- Horaires avec statut « Ouvert / Fermé » calculé en direct
- Contact & localisation : adresse, téléphone cliquable, carte Google Maps intégrée
- Page **La Maison** : 4 sections éditoriales (métier, geste, ingrédients, Monaco)
- Page **Nos Pâtes** : carte complète transcrite de la carte affichée en
  salle (pâtes classiques, farcies N°1/N°2, sauces incluses/en supplément,
  desserts, boissons/vins/bières), entièrement générée depuis `site-data.js`
- Footer complet : coordonnées, horaires, navigation, mentions, copyright dynamique
- Animations discrètes à l'apparition, respect de `prefers-reduced-motion`
- Focus clavier visible, HTML sémantique, `alt`/`aria-*` sur les éléments interactifs
- Données structurées Schema.org `Restaurant` (adresse, téléphone, horaires)
- `robots.txt` et `sitemap.xml`
