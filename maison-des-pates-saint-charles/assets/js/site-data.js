/**
 * SITE.js — données neutres, indépendantes de la langue.
 * Modifiez ici : téléphone, adresse, horaires, et la carte des pâtes
 * (catégories, plats, prix). Les textes traduits sont dans i18n.js.
 */
const SITE = {
  brand: 'Maison des Pâtes Saint-Charles',
  phoneDisplay: '+377 97 97 96 88',
  phoneHref: 'tel:+37797979688',
  address: {
    line1: '14 avenue Saint-Charles',
    line2: '98000 Monaco',
    mapsQuery: '14 avenue Saint-Charles, 98000 Monaco',
  },
  social: {
    instagram: '', // ex. 'https://instagram.com/votre-compte' — laissez vide pour masquer le lien
  },

  // Horaires : format 24h. `closed: true` pour un jour fermé.
  hours: [
    { day: 'mon', open: '08:00', close: '18:30' },
    { day: 'tue', open: '08:00', close: '18:30' },
    { day: 'wed', open: '08:00', close: '18:30' },
    { day: 'thu', open: '08:00', close: '18:30' },
    { day: 'fri', open: '08:00', close: '18:30' },
    { day: 'sat', open: '08:00', close: '17:00' },
    { day: 'sun', closed: true },
  ],

  // ---------------------------------------------------------------------
  // CARTE — transcrite de la carte affichée en salle (photo fournie).
  // C'est la carte réelle actuellement en vigueur au restaurant.
  // ⚠️ Pour toute mise à jour (nouveau plat, changement de prix), modifiez
  // uniquement les valeurs ci-dessous : le site se met à jour automatiquement,
  // sur les 3 langues, sans toucher au HTML ni au CSS.
  // ---------------------------------------------------------------------
  menu: {
    pastaCategories: [
      {
        id: 'classiques',
        price: '11.90€',
        half: '9.50€',
        maxi: '+3.60€',
        items: [
          'Gnocchi Classique',
          'Gnocchi Tris',
          'Fusilli Classique',
          'Tagliatelle Aux œufs',
          'Tagliatelle Épinard',
          'Trofie Classique',
          'Rigatoni Classique',
          'Spaghetti Aux œufs',
        ],
      },
      {
        id: 'farcies1',
        price: '12.80€',
        half: '10.50€',
        maxi: '+4.60€',
        items: [
          'Gnocchi Fromage',
          'Gnocchi Romaine',
          'Cannoncini Artichaut',
          'Cannoncini Courge',
          'Cannoncini Ricotta Épinards',
          'Ravioli Tomate Mozza',
        ],
      },
      {
        id: 'farcies2',
        price: '13.80€',
        half: '11.20€',
        maxi: '+4.60€',
        items: [
          'Cannoncini Verdure',
          'Cannoncini Viande',
          'Cannoncini Fonduta',
          'Cloches Aux cèpes',
          'Cappelletti Classique',
          'Ravioli Viande',
          'Ravioli Bourrache',
          'Ravioli Verdure',
          'Ravioli Courgette Speck',
          'Lasagne Classique',
          'Parmigiana d’Aubergines',
        ],
      },
    ],
    saucesIncluded: [
      'Tomate & Basilic',
      'Arrabiata',
      'Crème & Parmesan',
      'Beurre & Sauge',
      'Aglio, Olio & Peperoncino',
    ],
    saucesExtra: [
      { name: 'Gorgonzola', price: '+2€' },
      { name: 'Artichaut', price: '+2€' },
      { name: 'Noix', price: '+2€' },
      { name: 'Amatriciana', price: '+3€' },
      { name: 'Carbonara', price: '+3€' },
      { name: 'Pesto', price: '+3€' },
      { name: 'Crème de Truffe', price: '+3€' },
      { name: 'Bolognaise', price: '+4€' },
      { name: 'Cèpes', price: '+5€' },
      { name: 'Saumon', price: '+6€' },
    ],
    desserts: {
      price: '5€',
      items: ['Tiramisu', 'Panna cotta', 'Cheesecake spéculos', 'Salade de fruit', 'Dessert du jour'],
    },
    drinks: {
      water: [
        { name: 'Eau Minérale (0.5cl)', price: '2.30€' },
        { name: 'Eau Minérale (1L)', price: '4.60€' },
      ],
      soft: [
        { name: 'Redbull', price: '3.50€' },
        { name: 'Chinotto', price: '3.50€' },
        { name: 'Jus Pago — Abricot, ACE, Ananas, Pêche, Poire, Pomme', price: '3.20€' },
        { name: 'Soda — Coca-Cola, Coca-Cola Zero, Sprite, Ice Tea, Liptonic, Orangina, Fanta, Schweppes Agrumes, Oasis Tropical, Perrier', price: '2.70€' },
      ],
      wines: [
        { name: 'Cantina Zaccagnini, Montepulciano d’Abruzzo D.O.C.G. — Rouge', glass: '5.20€', bottle: '18€' },
        { name: 'Orvieto Classico « Campo Grande », Santa Cristina — Blanc', glass: '5.20€', bottle: '18€' },
        { name: 'Château de Berne « Esprit Méditerranée », I.G.P. — Rosé', glass: '5.20€', bottle: '18€' },
      ],
      beers: [
        { name: 'Heineken (canette 33cl)', price: '3.80€' },
        { name: 'Peroni (bouteille 33cl)', price: '4.50€' },
      ],
    },
  },
};
