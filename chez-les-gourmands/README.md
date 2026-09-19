# Chez les Gourmands — site vitrine

Site vitrine complet pour **Chez les Gourmands**, crêperie à Villefranche-sur-Mer
(7 rue de la Victoire). Aucune commande ni réservation en ligne : le contact se
fait par téléphone au 06 22 75 68 90.

Ce dossier est un projet **autonome**, séparé du site Beaulieu Pizza présent à
la racine de ce dépôt : il ne le modifie pas et peut être déployé indépendamment.

## Stack technique

**HTML5 / CSS3 / JavaScript vanilla**, sans build ni dépendance à installer :
le site fonctionne immédiatement, sur n'importe quel hébergement statique
(y compris Hostinger, indiqué comme hébergeur dans les mentions légales).

Deux dépendances externes seulement, chargées par CDN :
- **Google Fonts** (Fraunces + Inter)
- Aucune bibliothèque JS tierce : les icônes sont des SVG inline, pour éviter
  toute dépendance et tout retard de chargement.

## Structure du projet

```
chez-les-gourmands/
├── index.html              Accueil
├── carte.html               La carte (galettes, crêpes, boissons)
├── restaurant.html          Le restaurant (ambiance)
├── galerie.html              Galerie photo
├── contact.html              Contact & infos pratiques (carte Google Maps)
├── mentions-legales.html     Mentions légales (français uniquement)
├── confidentialite.html      Politique de confidentialité (français uniquement)
├── 404.html                  Page d'erreur 404
├── robots.txt
├── sitemap.xml
├── README.md                 Ce fichier
└── assets/
    ├── css/styles.css        Design system + tous les styles du site
    ├── js/
    │   ├── site-data.js       ★ FAITS NEUTRES — prix, ids, horaires, photos
    │   ├── i18n.js             ★ TOUS LES TEXTES, en français/anglais/russe
    │   └── main.js             Logique : sélecteur de langue, assemble
    │                          site-data.js + i18n.js, construit la carte,
    │                          la galerie, le menu mobile, le consentement
    │                          cookies et les données Schema.org
    └── favicon.svg
```

## ⚠️ Où modifier le contenu

Le site est piloté par **deux fichiers**, jamais directement par le HTML des
pages (à l'exception des mentions légales, volontairement statiques) :

- **`assets/js/site-data.js`** — tout ce qui est indépendant de la langue :
  téléphone, adresse, horaires, prix, identifiants de plats, chemins des
  photos.
- **`assets/js/i18n.js`** — tout le TEXTE affiché, en français, anglais et
  russe. C'est ici que vous corrigez une phrase d'accroche ou une
  traduction.

| Pour changer…                                    | Modifiez dans…                              |
|---------------------------------------------------|----------------------------------------------|
| **Le numéro de téléphone**                        | `SITE.phone.display` et `SITE.phone.href` (site-data.js) |
| **L'adresse**                                     | `SITE.address` (site-data.js) |
| **Les horaires d'ouverture**                      | `SITE.hours` (site-data.js) — répercuté automatiquement sur le tableau d'horaires, le résumé de la page d'accueil et les données Schema.org |
| **Le prix d'un plat**                             | `SITE.menuCategories` (site-data.js) — champ `price` de l'entrée `{id, price}` correspondante |
| **Le nom ou la description d'un plat, dans les 3 langues** | `I18N.<langue>.menu.items.<id>` (i18n.js) — même `id` que dans site-data.js |
| **Ajouter un plat**                               | 1) ajoutez `{id, price}` dans la bonne catégorie de `SITE.menuCategories` (site-data.js) ; 2) ajoutez le nom/la description correspondants dans `I18N.fr.menu.items`, `I18N.en.menu.items` et `I18N.ru.menu.items` (i18n.js), avec le même `id` |
| **L'aperçu de la carte en page d'accueil**        | `SITE.menuPreviewRefs` (site-data.js) — référence 4 plats déjà définis dans la carte, rien à dupliquer |
| **Les photos de la galerie**                      | `SITE.gallery` (site-data.js) ; légendes dans `I18N.<langue>.gallery.captions` (i18n.js) |
| **Le lien d'itinéraire / la carte intégrée**      | `SITE.address.mapsUrl` et `SITE.address.mapsEmbedUrl` (site-data.js) |
| **Un titre, une phrase d'accroche, un texte de présentation** | `I18N.<langue>.pages.<page>` (i18n.js) — voir la table des matières en tête de fichier |
| **Les mentions légales / la politique de confidentialité** | directement dans `mentions-legales.html` / `confidentialite.html` (contenu volontairement statique, en français uniquement — voir plus bas) |

### Allergènes

Le brief ne fournissait pas de liste d'allergènes par plat. Le champ
`description` de chaque plat, dans `i18n.js`, peut accueillir cette
information dès qu'elle sera communiquée — par exemple :
`description: "Jambon, emmental — contient gluten, lait"` (à répéter dans
les 3 langues). Un bandeau en haut de la page « La carte » invite déjà les
clients à signaler toute allergie par téléphone.

## 🌍 Langues

Le site est traduit intégralement en **français, anglais et russe**. Le
sélecteur (FR / EN / RU) est en haut à droite du site, sur toutes les
pages ; la langue choisie est mémorisée dans le navigateur (le visiteur la
retrouve à sa prochaine visite) et, par défaut, le site s'ouvre dans la
langue du navigateur du visiteur si elle est disponible, sinon en français.

**Choix éditorial sur les noms de plats** : comme sur une vraie carte de
restaurant multilingue, les noms « de marque » (La Reine, La Veggie, La
Lorraine, La Chèvry, La Burrata, La Fraisy, La Gourmandise, La Choco-Choco,
La Pommy, La Tatin) restent identiques dans les 3 langues. Les libellés
génériques (Classique 1, Complète, Champi, noms de boissons courantes...)
sont traduits pour rester compréhensibles par tous les visiteurs.

**Mentions légales et politique de confidentialité restent en français
uniquement**, volontairement : ce sont des textes à portée juridique
précise (droit français), où une traduction approximative représenterait
un risque plus grand qu'un bénéfice. Un bandeau s'affiche automatiquement
en haut de ces deux pages, dans la langue choisie par le visiteur, pour
l'en informer (« This page is available in French only. » /
« Эта страница доступна только на французском языке. »). Si une traduction
juridique officielle est un jour nécessaire, faites-la relire par un
professionnel plutôt que de vous fier à une traduction automatique.

**Limite à connaître (SEO)** : le sélecteur traduit le site *après*
chargement, côté navigateur (JavaScript). Le tout premier affichage — et ce
que voit un robot n'exécutant pas le JavaScript — reste en français. Pour
un référencement indexé séparément par langue (ex. `/en/`, `/ru/`), il
faudrait des URL dédiées par langue : une évolution possible, mais plus
lourde que ce sélecteur.

**Comment ajouter une traduction manquante** : si un texte reste affiché en
français dans une autre langue, c'est que sa clé n'existe pas encore dans
`I18N.en` ou `I18N.ru` (i18n.js) — le site se replie automatiquement sur le
français dans ce cas plutôt que d'afficher un texte vide. Ajoutez la clé
manquante au même endroit dans la structure que la version française.

## 📸 Photos — IMPORTANT

La photo du hero (page d'accueil, tout en haut) est une **vraie
photographie** de la façade et de la terrasse de l'établissement
(`assets/img/facade-terrasse.webp`), fournie par le client.

Toutes les **autres** photographies du site restent **temporaires** : ce
sont des images libres de droits (Unsplash), choisies pour leur cohérence
visuelle avec l'identité du restaurant, en attendant de vraies
photographies. Chaque occurrence est signalée par un commentaire ou un
texte alternatif « Photo de démonstration » dans le code.

Pour les remplacer :
1. Déposez vos fichiers dans `assets/img/`.
2. Remplacez la valeur `image` correspondante dans `site-data.js`
   (`SITE.hero.image`, `SITE.intro.image` — utilisées automatiquement sur
   toutes les pages via l'attribut `data-clg-img`, rien à changer dans le
   HTML — ou `SITE.gallery`) par le chemin local, par exemple
   `assets/img/facade.jpg`.
3. Mettez à jour le texte alternatif dans `i18n.js` (`heroImageAlt`,
   `introImageAlt`, `gallery.captions`, dans les 3 langues) pour qu'il
   décrive fidèlement la nouvelle photo — ce n'est plus une simple photo de
   démonstration, la mention « photo de démonstration » doit alors disparaître.

Conservez des photos de bonne définition (au moins 1600 px de large pour le
hero) et proches d'un ratio 4:3 ou 1:1 selon l'emplacement, pour éviter tout
recadrage disgracieux. Pensez à les compresser (formats WebP/AVIF conseillés)
avant mise en ligne.

## 🗺️ Carte interactive & cookies

La carte Google Maps (pages Accueil et Contact) ne se charge **jamais
automatiquement** : elle respecte un mécanisme de consentement réel,
implémenté dans `assets/js/main.js` :
- Au premier passage, un bandeau propose d'accepter ou de refuser son
  affichage.
- En cas de refus (ou avant tout choix), un simple lien texte vers Google
  Maps reste disponible pour l'itinéraire, sans dépôt de cookie.
- Le choix est mémorisé dans le `localStorage` du navigateur (aucune donnée
  envoyée à un serveur) et peut être modifié à tout moment via le lien
  « Gérer les cookies » du pied de page.

## ⚖️ Informations légales encore à compléter

Le brief fourni ne contenait pas certaines informations légalement utiles.
Elles sont signalées par le marqueur **`[INFORMATION À COMPLÉTER]`**
directement dans `mentions-legales.html` :
- la **forme juridique** de l'établissement (micro-entreprise, EI, SARL…) ;
- une **adresse e-mail de contact** professionnelle.

Aucune autre donnée (capital social, numéro RCS, etc.) n'a été ajoutée par
prudence, car non fournie et non applicable à toutes les formes juridiques.
Complétez ces champs dès que ces informations seront disponibles.

Par ailleurs, le code postal de Villefranche-sur-Mer (06230) a été ajouté
car il s'agit d'une information publique et non ambiguë (la commune n'a
qu'un seul code postal) ; vérifiez-le néanmoins avant mise en ligne.

## Nom de domaine

Le site utilise un nom de domaine provisoire
(`https://www.chezlesgourmands-villefranche.fr/`) dans les balises
`canonical`, Open Graph, `sitemap.xml` et `robots.txt`. Remplacez-le par le
véritable nom de domaine dans tous ces fichiers avant la mise en production.

## Lancer le site en local

Aucune installation n'est nécessaire. Deux options :
- Ouvrez `index.html` directement dans un navigateur.
- Ou, avec Node installé :
  ```bash
  npx serve .
  ```
- Ou avec Python :
  ```bash
  python3 -m http.server 8080
  ```

## Déployer

Le site est 100 % statique : il se dépose tel quel sur Hostinger (hébergeur
indiqué dans les mentions légales), Netlify, Vercel (« static site »),
GitHub Pages, ou tout hébergement mutualisé classique. Il suffit de copier
le contenu de ce dossier `chez-les-gourmands/` à la racine de l'espace web.

Avant la mise en production :
1. Remplacer le nom de domaine provisoire (voir ci-dessus).
2. Compléter les informations légales manquantes (voir ci-dessus).
3. Remplacer les photographies temporaires (voir ci-dessus).
4. Vérifier l'adresse et les horaires une dernière fois avec l'établissement.

## Accessibilité & SEO — ce qui a été implémenté

- HTML sémantique (`header`, `nav`, `main`, `section`, `address`, `footer`),
  lien d'évitement (« skip link »), focus clavier visible partout.
- Boutons d'appel (`tel:+33622756890`) et d'itinéraire fonctionnels sur
  chaque page, plus un bouton d'appel flottant sur mobile.
- Textes alternatifs descriptifs sur toutes les images, y compris les
  visuels de démonstration (clairement identifiés comme tels).
- Métadonnées uniques par page (titre, description, canonical, Open Graph),
  traduites en 3 langues (voir la note SEO ci-dessus sur le rendu côté client).
- Données structurées Schema.org `FoodEstablishment`, générées automatiquement
  depuis `site-data.js` (adresse, téléphone, horaires réels — dimanche fermé).
- `robots.txt` et `sitemap.xml`.
- Page 404 cohérente avec l'identité visuelle.
- Animations discrètes à l'apparition, désactivées si `prefers-reduced-motion`
  est activé sur l'appareil du visiteur.
- Chargement différé (`loading="lazy"`) des images hors zone visible initiale.
- Aucun outil de suivi, aucun cookie non essentiel : voir
  `confidentialite.html`.

## Vérifications effectuées

Le projet étant en HTML/CSS/JS vanilla sans build, aucun compilateur, linter
ou test automatisé n'est configuré (pas de `package.json`). Les vérifications
suivantes ont été faites :
- `node --check` sur les 3 fichiers JavaScript (aucune erreur de syntaxe).
- Script de cohérence des données : chaque plat référencé dans
  `site-data.js` possède bien une entrée dans `i18n.js` pour les 3 langues,
  et inversement (86 plats/boissons, 8 catégories, aucun écart).
- Validation de l'équilibre des balises HTML et de la cohérence des liens
  internes entre les 8 pages.
- Tests fonctionnels dans Chromium (headless) sur les 8 pages : changement
  de langue (FR/EN/RU), persistance du choix après rechargement, détection
  de la langue du navigateur par défaut, navigation mobile, mécanisme de
  consentement cookies (accepter/refuser/modifier), pluriel correct des
  compteurs de plats en russe (1/few/many) — aucune erreur JavaScript
  détectée dans la console.
