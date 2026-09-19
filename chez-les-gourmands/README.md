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
├── mentions-legales.html     Mentions légales
├── confidentialite.html      Politique de confidentialité
├── 404.html                  Page d'erreur 404
├── robots.txt
├── sitemap.xml
├── README.md                 Ce fichier
└── assets/
    ├── css/styles.css        Design system + tous les styles du site
    ├── js/
    │   ├── site-data.js       ★ FICHIER DE CONFIGURATION CENTRAL
    │   └── main.js             Logique : injecte les données du site,
    │                          construit la carte, la galerie, le menu
    │                          mobile, le consentement cookies, les
    │                          animations et les données Schema.org
    └── favicon.svg
```

## ⚠️ Où modifier le contenu

Toutes les informations factuelles et le contenu de la carte vivent dans
**`assets/js/site-data.js`** — c'est le seul fichier à modifier pour ces
éléments, ils se répercutent automatiquement sur toutes les pages du site
(liens d'appel, adresse, horaires, données Schema.org).

| Pour changer…                                    | Modifiez dans…                              |
|---------------------------------------------------|----------------------------------------------|
| **Le numéro de téléphone**                        | `SITE.phone.display` et `SITE.phone.href` (site-data.js) |
| **L'adresse**                                     | `SITE.address` (site-data.js) |
| **Les horaires d'ouverture**                      | `SITE.hours` (site-data.js) — répercuté automatiquement sur le tableau d'horaires, le résumé de la page d'accueil et les données Schema.org |
| **La carte complète** (plats, prix, descriptions) | `SITE.menuCategories` (site-data.js) — chaque catégorie est un bloc `{ id, title, items }`, chaque plat un objet `{ name, description, price }`. Ajoutez, modifiez ou supprimez librement une entrée. |
| **L'aperçu de la carte en page d'accueil**        | `SITE.menuPreview` (site-data.js) |
| **Les photos de la galerie**                      | `SITE.gallery` (site-data.js) |
| **Le lien d'itinéraire / la carte intégrée**      | `SITE.address.mapsUrl` et `SITE.address.mapsEmbedUrl` (site-data.js) |
| **Les textes longs** (accroche, présentation, page "Le restaurant") | directement dans le HTML de la page concernée (contenu rédactionnel, volontairement statique pour un rendu immédiat, sans dépendre du JavaScript) |
| **Les mentions légales**                          | `mentions-legales.html` (contenu statique — informations légales) |

### Allergènes

Le brief ne fournissait pas de liste d'allergènes par plat. Un espace est
prévu dans la structure de `SITE.menuCategories` (champ `description`) pour
ajouter cette information dès qu'elle sera communiquée — par exemple :
`description: "Jambon, emmental — contient gluten, lait"`. Un bandeau en
haut de la page « La carte » invite déjà les clients à signaler toute
allergie par téléphone.

## 📸 Photos — IMPORTANT

Toutes les photographies du site sont **temporaires** : ce sont des images
libres de droits (Unsplash), choisies pour leur cohérence visuelle avec
l'identité du restaurant (gourmandise, ambiance méditerranéenne), en
attendant de vraies photographies. Chaque occurrence est signalée par un
commentaire ou un texte alternatif « Photo de démonstration » dans le code.

Pour les remplacer :
1. Déposez vos fichiers dans `assets/img/`.
2. Remplacez la valeur `image` correspondante dans `site-data.js` (hero,
   aperçu de carte, galerie) par le chemin local, par exemple
   `assets/img/facade.jpg`.
3. Mettez à jour le texte alternatif (`imageAlt` / `alt`) pour qu'il décrive
   fidèlement la nouvelle photo.

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
- Métadonnées uniques par page (titre, description, canonical, Open Graph).
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
suivantes ont été faites manuellement :
- Validation de la cohérence des liens internes entre les 8 pages.
- Relecture de chaque fichier HTML pour la structure sémantique et les
  attributs d'accessibilité (`alt`, `aria-*`, `lang`).
- Relecture du JavaScript (`main.js`) pour s'assurer qu'aucune page ne
  provoque d'erreur si un élément attendu est absent (chaque fonction
  vérifie l'existence de son élément cible avant d'agir).
