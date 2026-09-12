/**
 * ============================================================================
 * BEAULIEU PIZZA — FICHIER DE CONFIGURATION CENTRAL
 * ============================================================================
 * Ce fichier ne contient que des données NEUTRES, indépendantes de la
 * langue : coordonnées, horaires, prix, ids, ingrédients (mots-clés) et
 * photos. Tout le texte affiché (titres, phrases, noms de catégories,
 * traductions) vit dans `assets/js/i18n.js`.
 *
 * → Pour changer un prix, une photo, un horaire ou l'adresse : modifiez ce
 *   fichier.
 * → Pour changer un texte, une phrase d'accroche ou une traduction :
 *   modifiez `i18n.js`.
 *
 * Chaque bloc d'image porte un commentaire "PLACEHOLDER" quand il s'agit
 * d'une photo libre de droits (Unsplash) utilisée à titre temporaire.
 * Remplacez-la par votre propre photographie dès qu'elle sera disponible.
 *
 * Les listes d'ingrédients (`ingredients`) sont des mots-clés en français,
 * traduits automatiquement via le dictionnaire `INGREDIENTS_I18N` dans
 * i18n.js — n'inventez pas un nouveau mot sans l'ajouter aussi à ce
 * dictionnaire, sinon il restera affiché en français dans les autres langues.
 * ============================================================================
 */

const SITE = {
  // ---------------------------------------------------------------------
  // IDENTITÉ & COORDONNÉES — à adapter en priorité
  // ---------------------------------------------------------------------
  name: "Beaulieu Pizza",
  foundedYear: 2014,

  // Numéro affiché au client ET lien tel: utilisé par TOUS les boutons
  // "Commander". Aucun panier, aucun paiement en ligne : la commande se fait
  // exclusivement par téléphone, comme demandé.
  phoneDisplay: "04 93 01 00 51",
  phoneHref: "tel:+33493010051",
  ORDER_URL: "tel:+33493010051", // constante unique à modifier si besoin

  // Commande en livraison via Uber Eats — lien fourni par le client.
  uberEatsUrl: "https://www.ubereats.com/fr/store/beaulieu-pizza/AcslqDpZQ62p51-n1MrJ3Q",

  email: "contact@beaulieu-pizza.fr", // à remplacer par l'adresse réelle

  address: {
    line1: "11 Bd du Maréchal Joffre",
    postalCode: "06310",
    city: "Beaulieu-sur-Mer",
    // Lien Google Maps fourni par le client
    mapsUrl:
      "https://www.google.com/maps/place//data=!4m2!3m1!1s0x12cddb359cd08a0f:0xfb7015987cdacc79?sa=X&ved=1t:8290&ictx=111",
    // Embed sans clé API (à remplacer par un Google Maps Embed API si besoin)
    mapsEmbedUrl:
      "https://www.google.com/maps?q=11+Bd+du+Mar%C3%A9chal+Joffre,+06310+Beaulieu-sur-Mer&output=embed",
    lat: 43.7048,
    lng: 7.3298,
  },

  social: {
    instagram: "https://www.instagram.com/beaulieu_pizza/",
  },

  // Horaires : { open, close } au format 24h "HH:MM", ou `null` si fermé
  // pour ce service. Les libellés ("Lundi", "Fermé"...) sont traduits dans
  // i18n.js à partir de la clé `day`.
  hours: [
    { day: "mon", lunch: { open: "11:30", close: "13:30" }, dinner: { open: "18:00", close: "22:00" } },
    { day: "tue", lunch: null, dinner: null },
    { day: "wed", lunch: { open: "11:30", close: "13:30" }, dinner: { open: "18:00", close: "22:00" } },
    { day: "thu", lunch: { open: "11:30", close: "13:30" }, dinner: { open: "18:00", close: "22:00" } },
    { day: "fri", lunch: { open: "11:30", close: "13:30" }, dinner: { open: "18:00", close: "22:00" } },
    { day: "sat", lunch: null, dinner: { open: "18:00", close: "22:00" } },
    { day: "sun", lunch: null, dinner: { open: "18:00", close: "22:00" } },
  ],

  // Les libellés de ces services sont dans i18n.js (`services`), sous ces ids.
  services: ["sur-place", "emporter", "livraison"],

  // ---------------------------------------------------------------------
  // NAVIGATION — libellés traduits dans i18n.js (`nav`), clé = id
  // ---------------------------------------------------------------------
  nav: [
    { id: "accueil", href: "#accueil" },
    { id: "carte", href: "#carte" },
    { id: "histoire", href: "#histoire" },
    { id: "contact", href: "#contact" },
  ],

  // ---------------------------------------------------------------------
  // HERO — texte dans i18n.js (`hero`)
  // ---------------------------------------------------------------------
  hero: {
    // PLACEHOLDER — photo Unsplash libre de droits, à remplacer par une
    // photographie professionnelle de la maison.
    image:
      "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=1800&q=75&auto=format&fit=crop",
    imageAlt: "Pizza au fromage fondant et pepperoni, part soulevée avec du fromage filant",
  },

  // ---------------------------------------------------------------------
  // PIZZAS POPULAIRES — les 6 vrais best-sellers de la maison, avec vos
  // propres photos (assets/img/). Remplacez chaque fichier par une photo
  // définitive quand vous l'aurez ; gardez le même nom de fichier pour ne
  // rien avoir d'autre à changer. Les noms de plats restent identiques
  // dans toutes les langues (comme sur une vraie carte multilingue).
  // ---------------------------------------------------------------------
  popularPizzas: [
    {
      id: "marguerite",
      name: "Marguerite",
      ingredients: ["tomate", "cantal", "olives", "origan"],
      price: "10 €",
      badges: ["vegetarian", "bestseller"],
      image: "assets/img/marguerite.jpg",
      imageAlt: "Pizza Marguerite, tomate, fromage fondant et olives, sortie du four",
    },
    {
      id: "reine",
      name: "Reine",
      ingredients: ["tomate", "cantal", "jambon", "champignons", "olives", "origan"],
      price: "14 €",
      badges: ["bestseller"],
      image: "assets/img/reine.jpg",
      imageAlt: "Pizza Reine, jambon et champignons, servie sur planche en bois",
    },
    {
      id: "quatre-fromages",
      name: "4 Fromages",
      ingredients: ["tomate", "cantal", "chèvre", "mozzarella", "roquefort", "olives", "origan"],
      price: "14 €",
      badges: ["vegetarian", "bestseller"],
      image: "assets/img/quatre-fromages.jpg",
      imageAlt: "Pizza 4 Fromages garnie de dés de fromage fondant et d’olives",
    },
    {
      id: "poulette",
      name: "Poulette",
      ingredients: ["tomate", "cantal", "poulet au curry", "poivrons", "crème fraîche", "oignons blancs", "olives", "origan"],
      price: "15 €",
      badges: ["bestseller"],
      image: "assets/img/poulette.jpg",
      imageAlt: "Pizza Poulette, poulet au curry, oignons et poivrons",
    },
    {
      id: "la-chef",
      name: "La Chef",
      ingredients: ["tomate", "cantal", "chèvre", "champignons", "poivrons", "oignons confits", "persillade", "olives", "origan"],
      price: "15 €",
      badges: ["vegetarian", "bestseller"],
      image: "assets/img/la-chef.jpg",
      imageAlt: "Pizza La Chef, champignons, chèvre et persillade",
    },
    {
      id: "calzone-nutella",
      name: "Calzone au Nutella",
      description: "Pâte pliée, chocolat Nutella",
      price: "7,50 €",
      badges: ["vegetarian", "bestseller"],
      image: "assets/img/calzone-nutella.jpg",
      imageAlt: "Calzone sucré au Nutella, sucre glace, sur pelle à pizza",
    },
  ],

  // ---------------------------------------------------------------------
  // CARTE COMPLÈTE — reprise fidèlement de votre carte papier, confirmée
  // avec vous. Chaque item a soit `ingredients` (liste traduite via le
  // dictionnaire), soit `description` (courte phrase, desserts/boissons,
  // traduite via MISC_DESC_I18N dans i18n.js).
  // ---------------------------------------------------------------------
  menuCategories: [
    {
      id: "classiques",
      image: null,
      items: [
        { name: "Reine", ingredients: ["tomate", "cantal", "jambon", "champignons", "olives", "origan"], price: "14 €", badges: ["bestseller"] },
        { name: "Chausson", ingredients: ["tomate", "cantal", "jambon", "champignons", "œuf", "crème fraîche", "olives", "origan"], price: "14 €", badges: [] },
        { name: "Spéciale", ingredients: ["tomate", "cantal", "jambon", "champignons", "mozzarella", "olives", "origan"], price: "14 €", badges: [] },
        { name: "4 Saisons", ingredients: ["tomate", "cantal", "jambon", "champignons", "cœur d’artichaut", "olives", "origan"], price: "14 €", badges: [] },
        { name: "Napolitaine", ingredients: ["tomate", "cantal", "anchois", "olives", "origan"], price: "14 €", badges: [] },
        { name: "Paysanne", ingredients: ["tomate", "cantal", "lardons", "champignons", "crème fraîche", "olives", "origan"], price: "14 €", badges: [] },
        { name: "Forestière", ingredients: ["tomate", "cantal", "champignons", "poivrons", "mozzarella", "olives", "origan"], price: "14 €", badges: ["vegetarian"] },
        { name: "Poivrons", ingredients: ["tomate", "cantal", "poivrons", "olives", "origan"], price: "14 €", badges: ["vegetarian"] },
        { name: "Oignons", ingredients: ["tomate", "cantal", "oignons confits", "olives", "origan"], price: "14 €", badges: ["vegetarian"] },
        { name: "Hawaïenne", ingredients: ["tomate", "cantal", "jambon", "ananas", "olives", "origan"], price: "14 €", badges: [] },
        { name: "Marguerite", ingredients: ["tomate", "cantal", "olives", "origan"], price: "10 €", badges: ["vegetarian", "bestseller"] },
      ],
    },
    {
      id: "specialites",
      image: null,
      items: [
        { name: "Royale", ingredients: ["tomate", "cantal", "jambon", "champignons", "cœur d’artichaut", "mozzarella", "olives", "origan"], price: "15 €", badges: [] },
        { name: "Gargantua", ingredients: ["tomate", "cantal", "jambon", "champignons", "chorizo", "olives", "origan"], price: "15 €", badges: ["spicy"] },
        { name: "La Chef", ingredients: ["tomate", "cantal", "chèvre", "champignons", "poivrons", "oignons confits", "persillade", "olives", "origan"], price: "15 €", badges: ["vegetarian", "bestseller"] },
        { name: "Pollux", ingredients: ["tomate", "cantal", "chèvre", "jambon", "olives", "origan"], price: "14 €", badges: [] },
        { name: "Parme", ingredients: ["tomate", "cantal", "jambon cru", "olives", "origan"], price: "14 €", badges: [] },
        { name: "Roma", ingredients: ["tomate", "cantal", "jambon cru", "gorgonzola", "olives", "origan"], price: "15 €", badges: [] },
        { name: "Niçoise", ingredients: ["tomate", "cantal", "thon", "poivrons", "câpres", "oignons crus", "persillade", "olives", "origan"], price: "15 €", badges: [] },
        { name: "Viandes", ingredients: ["tomate", "cantal", "viande hachée", "oignons confits", "olives", "origan"], price: "15 €", badges: [] },
        { name: "Américaine", ingredients: ["tomate", "cantal", "viande hachée", "oignons confits", "pomme de terre", "œuf", "olives", "origan"], price: "15 €", badges: [] },
        { name: "Chorizo", ingredients: ["tomate", "cantal", "champignons", "mozzarella", "chorizo", "olives", "origan"], price: "15 €", badges: ["spicy"] },
        { name: "L’Orientale", ingredients: ["tomate", "cantal", "merguez", "poivrons", "olives", "origan"], price: "15 €", badges: ["spicy"] },
        { name: "Poulette", ingredients: ["tomate", "cantal", "poulet au curry", "poivrons", "crème fraîche", "oignons blancs", "olives", "origan"], price: "15 €", badges: ["bestseller"] },
        { name: "Maya", ingredients: ["tomate", "cantal", "chèvre", "lardons", "miel", "olives", "origan"], price: "15 €", badges: [] },
        { name: "Tartiflette", ingredients: ["pomme de terre", "cantal", "lardons", "crème fraîche", "reblochon", "oignons confits", "olives", "origan"], price: "15 €", badges: [] },
        { name: "Alsacienne", ingredients: ["cantal", "lardons", "oignons crus", "crème fraîche", "olives", "origan"], price: "14 €", badges: [] },
        { name: "Pizza Apéro", ingredients: ["tomate", "jambon", "champignons", "cantal", "oignons confits", "poivrons"], price: "15 €", badges: [] },
      ],
    },
    {
      id: "mer",
      image: null,
      items: [
        { name: "Fruit de Mer", ingredients: ["tomate", "cantal", "cocktail de fruits de mer", "persillade", "olives", "origan"], price: "14 €", badges: [] },
        { name: "Neptune", ingredients: ["tomate", "cantal", "thon", "mozzarella", "câpres", "olives", "origan"], price: "14 €", badges: [] },
      ],
    },
    {
      id: "vegetariennes",
      image: null,
      items: [
        { name: "Végétarienne", ingredients: ["tomate", "cantal", "artichauts", "poivrons", "champignons", "mozzarella", "olives", "origan"], price: "15 €", badges: ["vegetarian"] },
        { name: "Aubergine", ingredients: ["tomate", "cantal", "aubergines", "parmesan", "olives", "origan"], price: "14 €", badges: ["vegetarian"] },
        { name: "4 Fromages", ingredients: ["tomate", "cantal", "chèvre", "mozzarella", "roquefort", "olives", "origan"], price: "14 €", badges: ["vegetarian", "bestseller"] },
        { name: "Chevrette", ingredients: ["tomate", "cantal", "chèvre", "olives", "origan"], price: "14 €", badges: ["vegetarian"] },
        { name: "Mozzarella", ingredients: ["tomate", "cantal", "mozzarella", "olives", "origan"], price: "14 €", badges: ["vegetarian"] },
        { name: "Gorgonzola", ingredients: ["tomate", "cantal", "gorgonzola", "olives", "origan"], price: "14 €", badges: ["vegetarian"] },
        { name: "Roquefort", ingredients: ["tomate", "cantal", "roquefort", "olives", "origan"], price: "14 €", badges: ["vegetarian"] },
      ],
    },
    {
      id: "desserts",
      image: null,
      items: [
        { name: "Calzone au Nutella", description: "Pâte pliée, chocolat Nutella", price: "7,50 €", badges: ["vegetarian", "bestseller"] },
        { name: "Tiramisu maison", description: "Recette de la maison", price: "5,50 €", badges: ["vegetarian"] },
        { name: "Dessert du jour", description: "Suggestion selon arrivage", price: "5,50 €", badges: ["vegetarian"] },
      ],
    },
    {
      id: "boissons",
      image: null,
      items: [
        { name: "Vin Corse San Perdonne", description: "Bouteille, rouge ou rosé", price: "13 €", badges: [] },
        { name: "Coca-Cola 1,5 L", description: "À partager", price: "4 €", badges: [] },
        { name: "Coca-Cola 33 cl", description: "Canette", price: "2,50 €", badges: [] },
        { name: "Fanta orange ou citron 33 cl", description: "Canette", price: "2,50 €", badges: [] },
        { name: "Eau plate 50 cl", description: "", price: "2,50 €", badges: [] },
        { name: "Eau pétillante 50 cl", description: "", price: "2,50 €", badges: [] },
        { name: "Kronenbourg 33 cl", description: "Bière", price: "2,50 €", badges: [] },
        { name: "Heineken 33 cl", description: "Bière", price: "2,50 €", badges: [] },
        { name: "Café", description: "", price: "1,50 €", badges: [] },
      ],
    },
  ],

  // ---------------------------------------------------------------------
  // NOTRE HISTOIRE — texte dans i18n.js (`about`)
  // ---------------------------------------------------------------------
  about: {
    image: "assets/img/facade-boutique.jpg",
    imageAlt: "Façade de Beaulieu Pizza le soir, enseigne noire et jaune",
  },

  // ---------------------------------------------------------------------
  // AVIS CLIENTS — prénom + note ici ; texte de l'avis dans i18n.js
  // (`TESTIMONIALS_I18N`, clé = prénom).
  // ---------------------------------------------------------------------
  testimonials: [
    { name: "Camille", rating: 5 },
    { name: "Julien", rating: 5 },
    { name: "Sophie", rating: 4 },
  ],
};
