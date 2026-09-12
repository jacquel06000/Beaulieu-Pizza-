# Beaulieu Pizza — site vitrine

Site vitrine complet pour **Beaulieu Pizza**, pizzeria artisanale à Beaulieu-sur-Mer.
Aucun paiement en ligne : toute commande se fait par téléphone (04 93 01 00 51).

## À propos de la stack

Le brief demandait Next.js/TypeScript/Tailwind « si le dossier est vide ». Cet
environnement ne dispose ni de Node.js, ni de npm, ni d'un gestionnaire de
paquets (aucune de ces commandes n'est installée sur cette machine) : il est
donc impossible d'y initialiser, d'y compiler ou d'y tester un projet Next.js
de façon fiable.

Le site a donc été construit en **HTML5 / CSS3 / JavaScript vanilla**, sans
build ni dépendance à installer : il fonctionne immédiatement, sur n'importe
quel hébergement statique, et reste facile à migrer vers Next.js plus tard si
vous le souhaitez (la structure — un fichier de données central, des sections
découpées, aucune logique dispersée dans le HTML — est pensée pour rendre
cette migration directe : `site-data.js` deviendrait un fichier de contenu /
CMS, chaque section un composant React).

Deux dépendances externes seulement, chargées par CDN, comme demandé :
- **Google Fonts** (Big Shoulders Display + Manrope)
- **Lucide Icons** (`lucide@0.460.0`, build UMD)

## Structure du projet

```
beaulieu-pizza/
├── index.html              Structure de la page (squelette sémantique, vide de contenu)
├── robots.txt
├── sitemap.xml
├── README.md                Ce fichier
└── assets/
    ├── css/styles.css       Toute la feuille de style (design system + composants)
    ├── js/
    │   ├── site-data.js      ★ DONNÉES NEUTRES — prix, horaires, photos, ids
    │   ├── i18n.js            ★ TOUS LES TEXTES, dans les 5 langues du site
    │   └── main.js            Logique : assemble site-data.js + i18n.js pour
    │                         produire le HTML, gère le sélecteur de langue,
    │                         le menu mobile, les filtres, les animations et
    │                         les données Schema.org
    └── favicon.svg / img/…
```

## ⚠️ Où modifier le contenu

Le site est piloté par **deux fichiers**, jamais par `index.html` :

- **`assets/js/site-data.js`** — tout ce qui est indépendant de la langue :
  prix, horaires, adresse, ids de plats, ingrédients (en mots-clés),
  chemins des photos.
- **`assets/js/i18n.js`** — tout le TEXTE affiché, en français, anglais,
  espagnol, italien et russe. C'est ici que vous corrigez une phrase
  d'accroche ou une traduction.

| Pour changer…                          | Modifiez dans… |
|-----------------------------------------|------------------------------------|
| Le numéro affiché et le lien d'appel    | `SITE.phoneDisplay` / `SITE.phoneHref` / `SITE.ORDER_URL` (site-data.js) |
| L'adresse, les coordonnées GPS          | `SITE.address` (site-data.js) |
| Les horaires (heures d'ouverture)       | `SITE.hours` (site-data.js) |
| Le libellé des jours / « Fermé »        | `I18N.<langue>.days` / `.hours` (i18n.js) |
| Les 6 pizzas populaires (accueil), prix, photos | `SITE.popularPizzas` (site-data.js) |
| La carte complète (plats, prix, photos) | `SITE.menuCategories` (site-data.js) |
| Les ingrédients d'un plat (les 5 langues à la fois) | `INGREDIENTS_I18N` (i18n.js) — dictionnaire, un mot traduit une fois pour toute la carte |
| Le nom/la description d'un dessert ou d'une boisson | `MISC_NAME_I18N` / `MISC_DESC_I18N` (i18n.js) |
| Le texte et la photo du hero            | `I18N.<langue>.hero` (texte) + `SITE.hero.image` (photo) |
| Le texte de « Notre histoire »          | `I18N.<langue>.about` (texte) + `SITE.about.image` (photo) |
| Les avis clients                        | `SITE.testimonials` (prénom/note) + `TESTIMONIALS_I18N` (texte, i18n.js) |
| Le compte Instagram                     | `SITE.social.instagram` (site-data.js) |
| Les mentions légales                    | `I18N.<langue>.legal` (i18n.js) |

Le bouton « Commander » (partout sur le site, y compris le bouton flottant)
pointe systématiquement vers **`SITE.ORDER_URL`**. C'est la seule constante à
changer si le numéro de téléphone évolue — elle est déjà réglée sur
`tel:+33493010051`.

## 🌍 Langues

Le site est traduit intégralement en **français, anglais, espagnol, italien
et russe**. Le sélecteur (drapeaux) est en haut à droite du site ; la langue
choisie est mémorisée (le visiteur la retrouve à sa prochaine visite) et,
par défaut, le site s'ouvre dans la langue du navigateur du visiteur si
elle est disponible, sinon en français.

**Choix éditorial** : les noms des plats et des boissons (Marguerite,
Reine, 4 Fromages, Coca-Cola, Kronenbourg…) restent identiques dans toutes
les langues, comme sur une vraie carte multilingue de pizzeria — seuls les
ingrédients, les descriptions et les textes de mise en scène sont traduits.
Deux desserts et l'eau/le café, dont le nom est plus générique, sont
traduits aussi (`MISC_NAME_I18N` dans `i18n.js`).

**Comment ajouter un ingrédient qui n'existe pas encore** : ajoutez-le à
`SITE.popularPizzas` / `SITE.menuCategories` (site-data.js) sous forme de
mot-clé français, PUIS ajoutez ce même mot-clé à `INGREDIENTS_I18N`
(i18n.js) avec ses 4 traductions. Si vous oubliez cette seconde étape, le
mot restera affiché en français dans les autres langues (rien ne casse,
mais ce n'est pas traduit).

**Limite à connaître** : le sélecteur traduit le site *après* chargement,
côté navigateur. Le premier chargement (et ce que voient les robots des
moteurs de recherche) reste en français. Pour un référencement indexé
séparément par langue (ex. `/en/`, `/es/`…), il faudrait des URL dédiées
par langue — une évolution possible, mais plus lourde que ce sélecteur.

## 📸 Photos — IMPORTANT

Toutes les photos du site sont **temporaires** : ce sont des photographies
libres de droits (Unsplash), choisies pour leur cohérence visuelle en
attendant vos propres photos professionnelles. Chaque URL est commentée
`PLACEHOLDER` dans `site-data.js` et centralisée par plat / section — il
suffit de remplacer la valeur de `image` par :
- une URL de votre hébergeur d'images, ou
- un chemin local, par exemple `assets/img/pizza-beaulieu.jpg` (déposez alors
  le fichier dans `assets/img/`).

Pensez à garder des photos au format paysage (ratio proche de 4:3) pour
éviter tout recadrage disgracieux.

## Où modifier le design

- **Couleurs, typographie, espacements** → `assets/css/styles.css`, section
  `:root` en haut du fichier (variables `--black-deep`, `--yellow`, etc.)
- La palette respecte strictement le cahier des charges : noir profond
  `#0B0B0B`, noir secondaire `#161616`, jaune `#FFD400` / survol `#FFE34D`,
  blanc cassé `#F7F7F2`, gris clair `#B8B8B8`.

## Lancer le site en local

Sans Node ni Python disponibles sur cette machine, le plus simple est d'ouvrir
`index.html` directement dans un navigateur, ou d'utiliser l'extension
« Live Server » de votre éditeur. Sur une machine avec Node installé :

```bash
npx serve .
```

## Déployer

Le site est 100 % statique : il se dépose tel quel sur Netlify, Vercel
(« static site »), GitHub Pages, ou tout hébergement mutualisé classique.
Pensez à :
1. Remplacer `https://www.beaulieu-pizza.fr/` par le vrai nom de domaine dans
   `index.html` (balises `canonical`, `og:*`) et dans `sitemap.xml` / `robots.txt`.
2. Compléter `SITE.legal.text` (SIRET, hébergeur, directeur de publication)
   dans `site-data.js`.
3. Remplacer les photos temporaires (voir ci-dessus).

## Ce qui a été implémenté

- Header semi-fixe avec navigation, menu mobile accessible, CTA « Commander »
- **Sélecteur de langue (FR/EN/ES/IT/RU) avec drapeaux, en haut à droite,
  traduction complète du site, choix mémorisé**
- Hero avec photo pleine largeur, accroche, double CTA, réassurance de services
- 4 engagements de la maison (icônes Lucide)
- 6 pizzas populaires en cartes, avec badges (Best-seller / Épicée / Végétarienne)
- Carte complète par catégories avec filtres fluides (JS, sans rechargement)
- Section « Notre histoire »
- Avis clients (note sur 5, prénom, commentaire)
- Informations pratiques : adresse, téléphone, horaires, services, carte Google Maps
- Footer complet : coordonnées, horaires, navigation, Instagram, mentions légales, copyright dynamique
- Bouton d'appel flottant, liens `tel:` partout
- Animations discrètes à l'apparition, désactivées si `prefers-reduced-motion`
- Focus clavier visible partout, HTML sémantique, `alt` sur toutes les images
- Données structurées Schema.org `Restaurant` (adresse, téléphone, horaires),
  générées automatiquement depuis `site-data.js`
- `robots.txt` et `sitemap.xml`
