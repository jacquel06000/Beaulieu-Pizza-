/**
 * ============================================================================
 * CHEZ LES GOURMANDS — FICHIER DE CONFIGURATION CENTRAL
 * ============================================================================
 * Toutes les informations factuelles du restaurant (nom, adresse, téléphone,
 * horaires) et le contenu de la carte vivent ICI, et nulle part ailleurs.
 * `main.js` lit cet objet pour :
 *   - remplir automatiquement tous les liens tel:/adresse/horaires du site
 *     (éléments portant un attribut data-clg-*) ;
 *   - générer les données structurées Schema.org (Restaurant) ;
 *   - construire la page « La carte » et l'aperçu de la carte en page d'accueil ;
 *   - construire la galerie photo.
 *
 * → Téléphone / adresse : modifiez SITE.phone et SITE.address.
 * → Horaires : modifiez SITE.hours.
 * → Carte (plats, prix, descriptions, allergènes) : modifiez SITE.menuCategories.
 * → Photos : modifiez SITE.gallery et les champs "image" ci-dessous.
 *
 * ⚠️ CONTENU TEMPORAIRE : la carte ci-dessous reprend le menu communiqué par
 * l'établissement. Les photographies utilisées dans tout le site (hero,
 * aperçu de carte, galerie) sont des visuels de démonstration libres de
 * droits (Unsplash), en attendant les photographies réelles du restaurant.
 * Chaque occurrence est signalée par un commentaire "PLACEHOLDER".
 * ============================================================================
 */

const SITE = {
  name: "Chez les Gourmands",
  tagline: "Crêperie & galettes à Villefranche-sur-Mer",

  phone: {
    display: "06 22 75 68 90",
    href: "tel:+33622756890",
  },

  address: {
    line1: "7 rue de la Victoire",
    postalCode: "06230",
    city: "Villefranche-sur-Mer",
    country: "France",
    // Lien d'itinéraire (recherche Google Maps par adresse — aucune coordonnée GPS
    // n'a été fournie, donc aucune n'est inventée ici).
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=7+rue+de+la+Victoire+06230+Villefranche-sur-Mer",
    // Embed sans clé API, chargé uniquement après consentement (voir main.js).
    mapsEmbedUrl: "https://www.google.com/maps?q=7+rue+de+la+Victoire,+06230+Villefranche-sur-Mer&output=embed",
  },

  // Horaires réels communiqués : du lundi au samedi, fermé le dimanche.
  // "closed: true" pour un jour fermé — utilisé pour l'affichage ET pour
  // les données structurées Schema.org (openingHoursSpecification).
  hours: [
    { day: "Lundi", schemaDay: "Monday", open: "07:30", close: "18:00" },
    { day: "Mardi", schemaDay: "Tuesday", open: "07:30", close: "18:00" },
    { day: "Mercredi", schemaDay: "Wednesday", open: "07:30", close: "18:00" },
    { day: "Jeudi", schemaDay: "Thursday", open: "07:30", close: "18:00" },
    { day: "Vendredi", schemaDay: "Friday", open: "07:30", close: "18:00" },
    { day: "Samedi", schemaDay: "Saturday", open: "07:30", close: "18:00" },
    { day: "Dimanche", schemaDay: "Sunday", closed: true },
  ],

  nav: [
    { id: "accueil", label: "Accueil", href: "index.html" },
    { id: "carte", label: "La carte", href: "carte.html" },
    { id: "restaurant", label: "Le restaurant", href: "restaurant.html" },
    { id: "galerie", label: "Galerie", href: "galerie.html" },
    { id: "contact", label: "Contact", href: "contact.html" },
  ],

  legalLinks: [
    { label: "Mentions légales", href: "mentions-legales.html" },
    { label: "Politique de confidentialité", href: "confidentialite.html" },
  ],

  // ---------------------------------------------------------------------
  // PHOTOS — visuels de démonstration (Unsplash, libres de droits),
  // à remplacer par les photographies du restaurant. PLACEHOLDER.
  // ---------------------------------------------------------------------
  hero: {
    image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=1800&q=75&auto=format&fit=crop",
    imageAlt: "Photo de démonstration — galette et crêpe dressées sur une table en bois, à remplacer par une photographie du restaurant",
  },
  intro: {
    image: "https://images.unsplash.com/photo-1550507992-eb63ffee0847?w=1200&q=75&auto=format&fit=crop",
    imageAlt: "Photo de démonstration — salle à manger chaleureuse et lumineuse, à remplacer par une photographie du restaurant",
  },

  // Aperçu de la carte en page d'accueil — un extrait, pas la carte complète.
  menuPreview: [
    {
      name: "La 3 Fromages",
      description: "Emmental, chèvre, roquefort, crème",
      price: "11,50 €",
      image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=75&auto=format&fit=crop",
      imageAlt: "Photo de démonstration — galette garnie de fromage, à remplacer",
    },
    {
      name: "La Burrata",
      description: "Emmental, salade, tomates, burrata, pesto maison",
      price: "14,50 €",
      image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=800&q=75&auto=format&fit=crop",
      imageAlt: "Photo de démonstration — galette garnie de burrata et tomates, à remplacer",
    },
    {
      name: "Nutella, Banane, Chantilly",
      description: "Crêpe sucrée",
      price: "7,00 €",
      image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800&q=75&auto=format&fit=crop",
      imageAlt: "Photo de démonstration — crêpe sucrée garnie, à remplacer",
    },
    {
      name: "Orange pressée",
      description: "25 cl, pressée minute",
      price: "4,50 €",
      image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=75&auto=format&fit=crop",
      imageAlt: "Photo de démonstration — jus d'orange pressée, à remplacer",
    },
  ],

  // ---------------------------------------------------------------------
  // LA CARTE COMPLÈTE — contenu communiqué par l'établissement.
  // Structure volontairement simple (nom, description/ingrédients, prix,
  // allergène facultatif) pour que le propriétaire puisse ajouter,
  // modifier ou retirer un plat sans toucher au reste du site.
  // ---------------------------------------------------------------------
  menuCategories: [
    {
      id: "galettes",
      title: "Les galettes",
      note: "Sarrasin — précisez vos allergies en commandant.",
      items: [
        { name: "Classique 1", description: "Jambon, emmental", price: "7,50 €" },
        { name: "Classique 2", description: "Œuf, emmental", price: "7,50 €" },
        { name: "Complète", description: "Œuf miroir ou brouillé, emmental, jambon", price: "8,70 €" },
        { name: "Champi", description: "Emmental, champignons, crème, jambon cru", price: "9,80 €" },
        { name: "3 Fromages", description: "Emmental, chèvre, roquefort, crème", price: "11,50 €" },
        { name: "La Reine", description: "Œuf, emmental, tomates, jambon cru", price: "10,90 €" },
        { name: "La Veggie", description: "Œuf, emmental, tomates, champignons, oignons", price: "11,20 €" },
        { name: "La Lorraine", description: "Emmental, jambon, champignons, oignons, crème", price: "11,50 €" },
        { name: "La Chèvry", description: "Emmental, confit d'oignons, chèvre grillé, miel, amandes", price: "12,50 €" },
        { name: "La Burrata", description: "Emmental, salade, tomates, burrata, pesto maison", price: "14,50 €" },
      ],
    },
    {
      id: "crepes-sucrees",
      title: "Les crêpes sucrées",
      items: [
        { name: "Beurre salé, sucre", description: "", price: "3,00 €" },
        { name: "Beurre salé, sucre, citron", description: "", price: "4,00 €" },
        { name: "Beurre salé, sucre roux, cannelle", description: "", price: "4,00 €" },
        { name: "Confiture", description: "Fraise, framboise ou orange amère", price: "4,10 €" },
        { name: "Miel de fleurs", description: "", price: "4,50 €" },
        { name: "Crème de marrons", description: "", price: "4,70 €" },
        { name: "Sirop d'érable", description: "", price: "4,50 €" },
        { name: "Chocolat noir", description: "Maison", price: "4,60 €" },
        { name: "Chocolat noir, banane", description: "", price: "6,10 €" },
        { name: "Chocolat noir, banane, chantilly", description: "", price: "7,60 €" },
        { name: "Nutella", description: "", price: "4,00 €" },
        { name: "Nutella, banane", description: "", price: "5,50 €" },
        { name: "Nutella, banane, chantilly", description: "", price: "7,00 €" },
        { name: "Caramel beurre salé", description: "Maison", price: "5,00 €" },
        { name: "Crêpe avec une boule de glace", description: "Vanille, chocolat, citron ou fraise", price: "5,50 €" },
        { name: "Caramel, chocolat", description: "Maison", price: "6,00 €" },
      ],
    },
    {
      id: "gourmandes",
      title: "Les gourmandes",
      items: [
        { name: "La Fraisy", description: "Fraises, chantilly", price: "8,50 €" },
        { name: "La Gourmandise", description: "Caramel au beurre salé, glace vanille, chantilly", price: "8,00 €" },
        { name: "La Choco-Choco", description: "Sauce chocolat, glace au chocolat, amandes, chantilly", price: "9,50 €" },
        { name: "La Pommy", description: "Pommes caramélisées, caramel, amandes", price: "9,90 €" },
        { name: "La Tatin", description: "Pommes caramélisées, crumble de sablé breton, glace vanille", price: "11,90 €" },
      ],
    },
    {
      id: "salades-omelettes",
      title: "Salades & omelettes",
      items: [
        { name: "Omelette nature", description: "Avec salade verte", price: "8,00 €" },
        { name: "Omelette jambon et fromage", description: "Avec salade verte", price: "9,90 €" },
        { name: "Omelette tomates, champignons", description: "Avec salade verte", price: "10,90 €" },
        { name: "Salade villageoise", description: "Salade, chèvre, tomates, champignons, jambon cru", price: "9,50 €" },
        { name: "Salade Caesar", description: "Salade, tomates, poulet grillé, croûtons, sauce", price: "12,00 €" },
      ],
    },
    {
      id: "formule",
      title: "Formule",
      items: [
        { name: "Formule crêpe jambon fromage", description: "Crêpe jambon fromage, crêpe au sucre, boisson soft", price: "" },
      ],
    },
    {
      id: "boissons-chaudes",
      title: "Boissons chaudes",
      items: [
        { name: "Café espresso", description: "", price: "1,80 €" },
        { name: "Décaféiné", description: "", price: "2,00 €" },
        { name: "Café noisette", description: "", price: "2,00 €" },
        { name: "Café américain", description: "", price: "2,30 €" },
        { name: "Double espresso", description: "", price: "3,40 €" },
        { name: "Cappuccino", description: "", price: "3,50 €" },
        { name: "Café crème", description: "", price: "3,50 €" },
        { name: "Café latte", description: "", price: "3,90 €" },
        { name: "Café viennois", description: "", price: "4,30 €" },
        { name: "Affogato café", description: "", price: "5,00 €" },
        { name: "Chocolat chaud italien", description: "", price: "3,50 €" },
        { name: "Chocolat chaud viennois", description: "", price: "4,80 €" },
        { name: "Thé noir Earl Grey", description: "", price: "3,50 €" },
        { name: "Thé noir English Breakfast", description: "", price: "3,50 €" },
        { name: "Thé vert Gunpowder", description: "", price: "3,50 €" },
        { name: "Thé vert Jasmine", description: "", price: "3,50 €" },
        { name: "Thé vert Marrakech Mint", description: "", price: "3,50 €" },
        { name: "Infusion fruits rouges", description: "", price: "3,50 €" },
        { name: "Infusion orange, cannelle, vanille", description: "", price: "3,50 €" },
        { name: "Tisane camomille", description: "", price: "3,50 €" },
        { name: "Tisane gingembre citron", description: "", price: "3,50 €" },
        { name: "Tisane purity", description: "", price: "3,50 €" },
      ],
    },
    {
      id: "boissons-fraiches",
      title: "Boissons fraîches",
      items: [
        { name: "Eau 50 cl", description: "", price: "3,00 €" },
        { name: "Badoit 50 cl", description: "", price: "3,00 €" },
        { name: "Coca-Cola 33 cl", description: "", price: "3,50 €" },
        { name: "Coca-Cola Zéro 33 cl", description: "", price: "3,50 €" },
        { name: "Oasis 33 cl", description: "", price: "3,50 €" },
        { name: "Orange pressée 25 cl", description: "", price: "4,50 €" },
        { name: "Citron pressé 25 cl", description: "", price: "4,50 €" },
        { name: "Jus de pomme 25 cl", description: "", price: "3,70 €" },
        { name: "Jus d'abricot 25 cl", description: "", price: "3,70 €" },
        { name: "Jus d'ananas 25 cl", description: "", price: "3,70 €" },
        { name: "Jus A.C.E. 25 cl", description: "", price: "3,70 €" },
        { name: "Capri-Sun", description: "", price: "2,00 €" },
        { name: "Soda à emporter", description: "", price: "2,50 €" },
        { name: "Ice Tea 33 cl", description: "", price: "3,50 €" },
        { name: "Sprite 33 cl", description: "", price: "3,50 €" },
        { name: "Fuze Tea 33 cl", description: "", price: "3,50 €" },
        { name: "Schweppes 33 cl", description: "", price: "3,50 €" },
        { name: "Red Bull 25 cl", description: "", price: "3,50 €" },
      ],
    },
    {
      id: "bar",
      title: "Cave & bar",
      items: [
        { name: "Cidre, verre 15 cl", description: "", price: "3,80 €" },
        { name: "Vin, verre 15 cl", description: "", price: "6,00 €" },
        { name: "Heineken 25 cl", description: "", price: "4,00 €" },
        { name: "Leffe 25 cl", description: "", price: "4,00 €" },
        { name: "Leffe 0.0% 25 cl", description: "", price: "3,50 €" },
        { name: "Leffe Blonde 50 cl", description: "", price: "7,50 €" },
        { name: "Cidre, bouteille 75 cl", description: "", price: "17,00 €" },
        { name: "Vin, bouteille 75 cl", description: "", price: "24,00 €" },
        { name: "Champagne, bouteille 75 cl", description: "", price: "45,00 €" },
      ],
    },
  ],

  // ---------------------------------------------------------------------
  // GALERIE — visuels de démonstration (Unsplash), à remplacer par de
  // vraies photographies de l'établissement, des plats et de l'ambiance.
  // ---------------------------------------------------------------------
  gallery: [
    { image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=900&q=75&auto=format&fit=crop", alt: "Photo de démonstration — crêpe sucrée garnie", caption: "Visuel de démonstration" },
    { image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=900&q=75&auto=format&fit=crop", alt: "Photo de démonstration — galette dressée", caption: "Visuel de démonstration" },
    { image: "https://images.unsplash.com/photo-1550507992-eb63ffee0847?w=900&q=75&auto=format&fit=crop", alt: "Photo de démonstration — salle à manger", caption: "Visuel de démonstration" },
    { image: "https://images.unsplash.com/photo-1600891964599-f61f2c8b5e3a?w=900&q=75&auto=format&fit=crop", alt: "Photo de démonstration — terrasse ensoleillée", caption: "Visuel de démonstration" },
    { image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&q=75&auto=format&fit=crop", alt: "Photo de démonstration — port de Villefranche-sur-Mer", caption: "Visuel de démonstration" },
    { image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=900&q=75&auto=format&fit=crop", alt: "Photo de démonstration — table dressée avec vue sur la mer", caption: "Visuel de démonstration" },
    { image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=900&q=75&auto=format&fit=crop", alt: "Photo de démonstration — jus de fruits pressés", caption: "Visuel de démonstration" },
    { image: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=900&q=75&auto=format&fit=crop", alt: "Photo de démonstration — galette garnie de burrata", caption: "Visuel de démonstration" },
    { image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=75&auto=format&fit=crop", alt: "Photo de démonstration — ruelle typique de la Côte d'Azur", caption: "Visuel de démonstration" },
  ],
};
