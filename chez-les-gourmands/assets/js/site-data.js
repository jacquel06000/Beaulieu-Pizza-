/**
 * ============================================================================
 * CHEZ LES GOURMANDS — FICHIER DE CONFIGURATION CENTRAL
 * ============================================================================
 * Ce fichier ne contient QUE des données neutres, indépendantes de la langue :
 * coordonnées, horaires, prix et identifiants. Tous les TEXTES affichés
 * (titres, phrases, noms de plats, descriptions, traductions FR/EN/RU) vivent
 * dans `assets/js/i18n.js`.
 *
 * → Téléphone / adresse : modifiez SITE.phone et SITE.address.
 * → Horaires : modifiez SITE.hours (ordre + heures ; le libellé du jour est
 *   traduit depuis i18n.js à partir de la clé `dayKey`).
 * → Prix d'un plat : modifiez le champ `price` correspondant ci-dessous.
 * → Nom, description ou traduction d'un plat : modifiez `assets/js/i18n.js`
 *   (dictionnaire `I18N.<langue>.menu.items.<id>`), en utilisant le même
 *   identifiant `id` que ci-dessous.
 * → Ajouter un plat : ajoutez un objet {id, price} ici, PUIS ajoutez son nom
 *   et sa description dans les 3 langues de `i18n.js`.
 *
 * ⚠️ CONTENU TEMPORAIRE : les photographies utilisées dans le site (hero,
 * galerie) sont des visuels de démonstration libres de droits (Unsplash),
 * en attendant les photographies réelles du restaurant.
 * ============================================================================
 */

const SITE = {
  name: "Chez les Gourmands",

  phone: {
    display: "06 22 75 68 90",
    href: "tel:+33622756890",
  },

  address: {
    line1: "7 rue de la Victoire",
    postalCode: "06230",
    city: "Villefranche-sur-Mer",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=7+rue+de+la+Victoire+06230+Villefranche-sur-Mer",
    mapsEmbedUrl: "https://www.google.com/maps?q=7+rue+de+la+Victoire,+06230+Villefranche-sur-Mer&output=embed",
  },

  // Horaires réels communiqués : du lundi au samedi, fermé le dimanche.
  hours: [
    { dayKey: "mon", schemaDay: "Monday", open: "07:30", close: "18:00" },
    { dayKey: "tue", schemaDay: "Tuesday", open: "07:30", close: "18:00" },
    { dayKey: "wed", schemaDay: "Wednesday", open: "07:30", close: "18:00" },
    { dayKey: "thu", schemaDay: "Thursday", open: "07:30", close: "18:00" },
    { dayKey: "fri", schemaDay: "Friday", open: "07:30", close: "18:00" },
    { dayKey: "sat", schemaDay: "Saturday", open: "07:30", close: "18:00" },
    { dayKey: "sun", schemaDay: "Sunday", closed: true },
  ],

  nav: [
    { id: "accueil", href: "index.html" },
    { id: "carte", href: "carte.html" },
    { id: "restaurant", href: "restaurant.html" },
    { id: "galerie", href: "galerie.html" },
    { id: "contact", href: "contact.html" },
  ],

  legalLinks: [
    { id: "mentions", href: "mentions-legales.html" },
    { id: "confidentialite", href: "confidentialite.html" },
  ],

  // ---------------------------------------------------------------------
  // PHOTOS — visuels de démonstration (Unsplash), PLACEHOLDER.
  // ---------------------------------------------------------------------
  hero: {
    image: "assets/img/facade-terrasse.webp",
  },
  intro: {
    image: "https://images.unsplash.com/photo-1550507992-eb63ffee0847?w=1200&q=75&auto=format&fit=crop",
  },

  // Aperçu de la carte en page d'accueil : référence des plats déjà définis
  // ci-dessous (pas de contenu dupliqué — nom/prix viennent de la carte réelle).
  menuPreviewRefs: [
    { cat: "galettes", id: "gal-3-fromages" },
    { cat: "galettes", id: "gal-burrata" },
    { cat: "crepes-sucrees", id: "cs-nutella-banane-chantilly" },
    { cat: "boissons-fraiches", id: "bf-orange-pressee" },
  ],

  // ---------------------------------------------------------------------
  // LA CARTE COMPLÈTE — identifiants + prix uniquement. Noms, descriptions
  // et traductions dans assets/js/i18n.js (I18N.<langue>.menu).
  // ---------------------------------------------------------------------
  menuCategories: [
    {
      id: "galettes",
      items: [
        { id: "gal-classique-1", price: "7,50 €" },
        { id: "gal-classique-2", price: "7,50 €" },
        { id: "gal-complete", price: "8,70 €" },
        { id: "gal-champi", price: "9,80 €" },
        { id: "gal-3-fromages", price: "11,50 €" },
        { id: "gal-reine", price: "10,90 €" },
        { id: "gal-veggie", price: "11,20 €" },
        { id: "gal-lorraine", price: "11,50 €" },
        { id: "gal-chevry", price: "12,50 €" },
        { id: "gal-burrata", price: "14,50 €" },
      ],
    },
    {
      id: "crepes-sucrees",
      items: [
        { id: "cs-beurre-sucre", price: "3,00 €" },
        { id: "cs-beurre-sucre-citron", price: "4,00 €" },
        { id: "cs-beurre-sucre-roux-cannelle", price: "4,00 €" },
        { id: "cs-confiture", price: "4,10 €" },
        { id: "cs-miel-fleurs", price: "4,50 €" },
        { id: "cs-creme-marrons", price: "4,70 €" },
        { id: "cs-sirop-erable", price: "4,50 €" },
        { id: "cs-chocolat-noir", price: "4,60 €" },
        { id: "cs-chocolat-noir-banane", price: "6,10 €" },
        { id: "cs-chocolat-noir-banane-chantilly", price: "7,60 €" },
        { id: "cs-nutella", price: "4,00 €" },
        { id: "cs-nutella-banane", price: "5,50 €" },
        { id: "cs-nutella-banane-chantilly", price: "7,00 €" },
        { id: "cs-caramel-beurre-sale", price: "5,00 €" },
        { id: "cs-boule-glace", price: "5,50 €" },
        { id: "cs-caramel-chocolat", price: "6,00 €" },
      ],
    },
    {
      id: "gourmandes",
      items: [
        { id: "gm-fraisy", price: "8,50 €" },
        { id: "gm-gourmandise", price: "8,00 €" },
        { id: "gm-choco-choco", price: "9,50 €" },
        { id: "gm-pommy", price: "9,90 €" },
        { id: "gm-tatin", price: "11,90 €" },
      ],
    },
    {
      id: "salades-omelettes",
      items: [
        { id: "so-omelette-nature", price: "8,00 €" },
        { id: "so-omelette-jambon-fromage", price: "9,90 €" },
        { id: "so-omelette-tomates-champignons", price: "10,90 €" },
        { id: "so-salade-villageoise", price: "9,50 €" },
        { id: "so-salade-caesar", price: "12,00 €" },
      ],
    },
    {
      id: "formule",
      items: [
        { id: "fm-crepe-jambon-fromage", price: "" },
      ],
    },
    {
      id: "boissons-chaudes",
      items: [
        { id: "bc-espresso", price: "1,80 €" },
        { id: "bc-deca", price: "2,00 €" },
        { id: "bc-noisette", price: "2,00 €" },
        { id: "bc-americain", price: "2,30 €" },
        { id: "bc-double-espresso", price: "3,40 €" },
        { id: "bc-cappuccino", price: "3,50 €" },
        { id: "bc-creme", price: "3,50 €" },
        { id: "bc-latte", price: "3,90 €" },
        { id: "bc-viennois", price: "4,30 €" },
        { id: "bc-affogato", price: "5,00 €" },
        { id: "bc-chocolat-italien", price: "3,50 €" },
        { id: "bc-chocolat-viennois", price: "4,80 €" },
        { id: "bc-the-earl-grey", price: "3,50 €" },
        { id: "bc-the-english-breakfast", price: "3,50 €" },
        { id: "bc-the-gunpowder", price: "3,50 €" },
        { id: "bc-the-jasmine", price: "3,50 €" },
        { id: "bc-the-marrakech-mint", price: "3,50 €" },
        { id: "bc-infusion-fruits-rouges", price: "3,50 €" },
        { id: "bc-infusion-orange-cannelle-vanille", price: "3,50 €" },
        { id: "bc-tisane-camomille", price: "3,50 €" },
        { id: "bc-tisane-gingembre-citron", price: "3,50 €" },
        { id: "bc-tisane-purity", price: "3,50 €" },
      ],
    },
    {
      id: "boissons-fraiches",
      items: [
        { id: "bf-eau-50", price: "3,00 €" },
        { id: "bf-badoit-50", price: "3,00 €" },
        { id: "bf-coca-33", price: "3,50 €" },
        { id: "bf-coca-zero-33", price: "3,50 €" },
        { id: "bf-oasis-33", price: "3,50 €" },
        { id: "bf-orange-pressee", price: "4,50 €" },
        { id: "bf-citron-presse", price: "4,50 €" },
        { id: "bf-jus-pomme", price: "3,70 €" },
        { id: "bf-jus-abricot", price: "3,70 €" },
        { id: "bf-jus-ananas", price: "3,70 €" },
        { id: "bf-jus-ace", price: "3,70 €" },
        { id: "bf-capri-sun", price: "2,00 €" },
        { id: "bf-soda-emporter", price: "2,50 €" },
        { id: "bf-ice-tea-33", price: "3,50 €" },
        { id: "bf-sprite-33", price: "3,50 €" },
        { id: "bf-fuze-tea-33", price: "3,50 €" },
        { id: "bf-schweppes-33", price: "3,50 €" },
        { id: "bf-red-bull-25", price: "3,50 €" },
      ],
    },
    {
      id: "bar",
      items: [
        { id: "bar-cidre-verre", price: "3,80 €" },
        { id: "bar-vin-verre", price: "6,00 €" },
        { id: "bar-heineken-25", price: "4,00 €" },
        { id: "bar-leffe-25", price: "4,00 €" },
        { id: "bar-leffe-00-25", price: "3,50 €" },
        { id: "bar-leffe-blonde-50", price: "7,50 €" },
        { id: "bar-cidre-bouteille-75", price: "17,00 €" },
        { id: "bar-vin-bouteille-75", price: "24,00 €" },
        { id: "bar-champagne-bouteille-75", price: "45,00 €" },
      ],
    },
  ],

  // ---------------------------------------------------------------------
  // GALERIE — visuels de démonstration (Unsplash), PLACEHOLDER.
  // Légende traduite dans i18n.js (I18N.<langue>.gallery.demoCaption).
  // ---------------------------------------------------------------------
  gallery: [
    { image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=900&q=75&auto=format&fit=crop" },
    { image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=900&q=75&auto=format&fit=crop" },
    { image: "https://images.unsplash.com/photo-1550507992-eb63ffee0847?w=900&q=75&auto=format&fit=crop" },
    { image: "https://images.unsplash.com/photo-1600891964599-f61f2c8b5e3a?w=900&q=75&auto=format&fit=crop" },
    { image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=75&auto=format&fit=crop" },
    { image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=900&q=75&auto=format&fit=crop" },
    { image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=900&q=75&auto=format&fit=crop" },
    { image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=900&q=75&auto=format&fit=crop" },
    { image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=75&auto=format&fit=crop" },
  ],
};
