/**
 * ============================================================================
 * BEAULIEU PIZZA — TRADUCTIONS (FR / EN / ES / IT / RU)
 * ============================================================================
 * Tout le texte affiché sur le site vit ici, par langue. `site-data.js` ne
 * contient plus que des données neutres (prix, horaires, ids, photos) ; ce
 * fichier fournit le texte correspondant dans les 5 langues.
 *
 * Pour changer une traduction : cherchez la clé (ex. `hero.title`) dans
 * chaque bloc de langue ci-dessous et modifiez le texte.
 *
 * Choix éditorial : les NOMS des plats et boissons de marque (Marguerite,
 * Reine, Coca-Cola, Kronenbourg…) restent identiques dans toutes les
 * langues, comme sur une vraie carte multilingue de pizzeria — seuls les
 * ingrédients, descriptions et textes de mise en scène sont traduits.
 * ============================================================================
 */

// ---------------------------------------------------------------------
// Langues disponibles pour le sélecteur (en haut à droite du site)
// ---------------------------------------------------------------------
const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];
const DEFAULT_LANG = "fr";

// ---------------------------------------------------------------------
// Dictionnaire d'ingrédients — permet de traduire toutes les descriptions
// de pizza sans jamais dupliquer une phrase entière 5 fois. Clé = mot
// français exact tel qu'utilisé dans `site-data.js` (voir `ingredients`).
// ---------------------------------------------------------------------
const INGREDIENTS_I18N = {
  "tomate": { en: "tomato", es: "tomate", it: "pomodoro", ru: "томат" },
  "cantal": { en: "cantal cheese", es: "queso cantal", it: "formaggio cantal", ru: "сыр канталь" },
  "jambon": { en: "ham", es: "jamón", it: "prosciutto cotto", ru: "ветчина" },
  "champignons": { en: "mushrooms", es: "champiñones", it: "funghi", ru: "грибы" },
  "olives": { en: "olives", es: "aceitunas", it: "olive", ru: "маслины" },
  "origan": { en: "oregano", es: "orégano", it: "origano", ru: "орегано" },
  "mozzarella": { en: "mozzarella", es: "mozzarella", it: "mozzarella", ru: "моцарелла" },
  "cœur d’artichaut": { en: "artichoke heart", es: "corazón de alcachofa", it: "cuore di carciofo", ru: "сердцевина артишока" },
  "anchois": { en: "anchovies", es: "anchoas", it: "acciughe", ru: "анчоусы" },
  "artichauts": { en: "artichokes", es: "alcachofas", it: "carciofi", ru: "артишоки" },
  "poivrons": { en: "bell peppers", es: "pimientos", it: "peperoni", ru: "болгарский перец" },
  "aubergines": { en: "eggplant", es: "berenjenas", it: "melanzane", ru: "баклажаны" },
  "parmesan": { en: "parmesan", es: "parmesano", it: "parmigiano", ru: "пармезан" },
  "chorizo": { en: "chorizo", es: "chorizo", it: "chorizo", ru: "чоризо" },
  "chèvre": { en: "goat cheese", es: "queso de cabra", it: "formaggio di capra", ru: "козий сыр" },
  "oignons confits": { en: "caramelised onions", es: "cebolla confitada", it: "cipolle caramellate", ru: "карамелизированный лук" },
  "persillade": { en: "garlic & parsley", es: "perejil y ajo", it: "prezzemolo e aglio", ru: "петрушка с чесноком" },
  "lardons": { en: "bacon lardons", es: "taquitos de bacon", it: "pancetta a dadini", ru: "бекон" },
  "miel": { en: "honey", es: "miel", it: "miele", ru: "мёд" },
  "roquefort": { en: "Roquefort", es: "Roquefort", it: "Roquefort", ru: "рокфор" },
  "cocktail de fruits de mer": { en: "seafood cocktail", es: "cóctel de marisco", it: "cocktail di frutti di mare", ru: "коктейль из морепродуктов" },
  "gorgonzola": { en: "gorgonzola", es: "gorgonzola", it: "gorgonzola", ru: "горгонзола" },
  "jambon cru": { en: "cured ham", es: "jamón curado", it: "prosciutto crudo", ru: "сыровяленая ветчина" },
  "ananas": { en: "pineapple", es: "piña", it: "ananas", ru: "ананас" },
  "œuf": { en: "egg", es: "huevo", it: "uovo", ru: "яйцо" },
  "crème fraîche": { en: "crème fraîche", es: "nata fresca", it: "panna fresca", ru: "сливки" },
  "merguez": { en: "merguez sausage", es: "salchicha merguez", it: "salsiccia merguez", ru: "колбаски мергез" },
  "oignons blancs": { en: "white onions", es: "cebolla blanca", it: "cipolla bianca", ru: "белый лук" },
  "oignons crus": { en: "raw onions", es: "cebolla cruda", it: "cipolla cruda", ru: "свежий лук" },
  "thon": { en: "tuna", es: "atún", it: "tonno", ru: "тунец" },
  "câpres": { en: "capers", es: "alcaparras", it: "capperi", ru: "каперсы" },
  "viande hachée": { en: "minced beef", es: "carne picada", it: "carne macinata", ru: "рубленое мясо" },
  "pomme de terre": { en: "potato", es: "patata", it: "patata", ru: "картофель" },
  "poulet au curry": { en: "curry chicken", es: "pollo al curry", it: "pollo al curry", ru: "курица карри" },
  "reblochon": { en: "reblochon", es: "reblochon", it: "reblochon", ru: "реблошон" },
};

// ---------------------------------------------------------------------
// Noms & descriptions des desserts / boissons (pas des listes d'ingrédients
// : traduits comme de courtes phrases). Clé = texte français exact.
// ---------------------------------------------------------------------
const MISC_NAME_I18N = {
  "Calzone au Nutella": { en: "Nutella Calzone", es: "Calzone de Nutella", it: "Calzone alla Nutella", ru: "Кальцоне с Nutella" },
  "Tiramisu maison": { en: "Homemade Tiramisu", es: "Tiramisú casero", it: "Tiramisù della casa", ru: "Домашний тирамису" },
  "Dessert du jour": { en: "Dessert of the day", es: "Postre del día", it: "Dolce del giorno", ru: "Десерт дня" },
  "Vin Corse San Perdonne": { en: "Corsican Wine, San Perdonne", es: "Vino corso San Perdonne", it: "Vino corso San Perdonne", ru: "Корсиканское вино San Perdonne" },
  "Coca-Cola 1,5 L": { en: "Coca-Cola 1.5 L", es: "Coca-Cola 1,5 L", it: "Coca-Cola 1,5 L", ru: "Coca-Cola 1,5 л" },
  "Fanta orange ou citron 33 cl": { en: "Fanta orange or lemon, 33 cl", es: "Fanta naranja o limón, 33 cl", it: "Fanta arancia o limone, 33 cl", ru: "Fanta апельсин или лимон, 33 cl" },
  "Eau plate 50 cl": { en: "Still water, 50 cl", es: "Agua sin gas, 50 cl", it: "Acqua naturale, 50 cl", ru: "Негазированная вода, 50 cl" },
  "Eau pétillante 50 cl": { en: "Sparkling water, 50 cl", es: "Agua con gas, 50 cl", it: "Acqua frizzante, 50 cl", ru: "Газированная вода, 50 cl" },
  "Café": { en: "Coffee", es: "Café", it: "Caffè", ru: "Кофе" },
};

const MISC_DESC_I18N = {
  "Pâte pliée, chocolat Nutella": { en: "Folded dough, Nutella chocolate", es: "Masa doblada, chocolate Nutella", it: "Pasta ripiegata, cioccolato Nutella", ru: "Тесто конвертом, шоколад Nutella" },
  "Recette de la maison": { en: "House recipe", es: "Receta de la casa", it: "Ricetta della casa", ru: "Домашний рецепт" },
  "Suggestion selon arrivage": { en: "Chef’s suggestion, subject to availability", es: "Sugerencia según disponibilidad", it: "Suggerimento secondo disponibilità", ru: "Предложение дня, по наличию" },
  "Bouteille, rouge ou rosé": { en: "Bottle, red or rosé", es: "Botella, tinto o rosado", it: "Bottiglia, rosso o rosé", ru: "Бутылка, красное или розовое" },
  "À partager": { en: "To share", es: "Para compartir", it: "Da condividere", ru: "На компанию" },
  "Canette": { en: "Can", es: "Lata", it: "Lattina", ru: "Банка" },
  "Bière": { en: "Beer", es: "Cerveza", it: "Birra", ru: "Пиво" },
};

// ---------------------------------------------------------------------
// Textes alternatifs des photos (accessibilité), traduits eux aussi.
// Clé = texte français exact tel qu'utilisé dans `site-data.js`.
// ---------------------------------------------------------------------
const ALT_I18N = {
  "Pizza au fromage fondant et pepperoni, part soulevée avec du fromage filant": {
    en: "Melted-cheese pepperoni pizza, a slice lifted with stretching cheese",
    es: "Pizza de pepperoni con queso fundido, una porción levantada con hilos de queso",
    it: "Pizza al pepperoni con formaggio filante, una fetta sollevata",
    ru: "Пицца с пепперони и тянущимся сыром, приподнятый кусок",
  },
  "Façade de Beaulieu Pizza le soir, enseigne noire et jaune": {
    en: "Beaulieu Pizza’s storefront at night, black and yellow sign",
    es: "Fachada de Beaulieu Pizza de noche, letrero negro y amarillo",
    it: "Facciata di Beaulieu Pizza di sera, insegna nera e gialla",
    ru: "Фасад Beaulieu Pizza вечером, чёрно-жёлтая вывеска",
  },
  "Pizza Marguerite, tomate, fromage fondant et olives, sortie du four": {
    en: "Marguerite pizza, tomato, melted cheese and olives, fresh from the oven",
    es: "Pizza Marguerite, tomate, queso fundido y aceitunas, recién horneada",
    it: "Pizza Marguerite, pomodoro, formaggio filante e olive, appena sfornata",
    ru: "Пицца Marguerite, томат, плавленый сыр и маслины, только из печи",
  },
  "Pizza Reine, jambon et champignons, servie sur planche en bois": {
    en: "Reine pizza, ham and mushrooms, served on a wooden board",
    es: "Pizza Reine, jamón y champiñones, servida sobre tabla de madera",
    it: "Pizza Reine, prosciutto e funghi, servita su tagliere di legno",
    ru: "Пицца Reine, ветчина и грибы, подана на деревянной доске",
  },
  "Pizza 4 Fromages garnie de dés de fromage fondant et d’olives": {
    en: "4 Fromages pizza topped with melted cheese cubes and olives",
    es: "Pizza 4 Fromages con dados de queso fundido y aceitunas",
    it: "Pizza 4 Fromages con cubetti di formaggio filante e olive",
    ru: "Пицца 4 Fromages с кубиками плавленого сыра и маслинами",
  },
  "Pizza Poulette, poulet au curry, oignons et poivrons": {
    en: "Poulette pizza, curry chicken, onions and bell peppers",
    es: "Pizza Poulette, pollo al curry, cebolla y pimientos",
    it: "Pizza Poulette, pollo al curry, cipolla e peperoni",
    ru: "Пицца Poulette, курица карри, лук и болгарский перец",
  },
  "Pizza La Chef, champignons, chèvre et persillade": {
    en: "La Chef pizza, mushrooms, goat cheese and garlic-parsley",
    es: "Pizza La Chef, champiñones, queso de cabra y perejil con ajo",
    it: "Pizza La Chef, funghi, formaggio di capra e prezzemolo-aglio",
    ru: "Пицца La Chef, грибы, козий сыр и петрушка с чесноком",
  },
  "Calzone sucré au Nutella, sucre glace, sur pelle à pizza": {
    en: "Sweet Nutella calzone, icing sugar, on a pizza peel",
    es: "Calzone dulce de Nutella, azúcar glas, sobre pala de pizza",
    it: "Calzone dolce alla Nutella, zucchero a velo, su pala per pizza",
    ru: "Сладкое кальцоне с Nutella, сахарная пудра, на лопате для пиццы",
  },
  "Pizza classique aux tomates fraîches et basilic sur planche en bois": {
    en: "Classic pizza with fresh tomatoes and basil on a wooden board",
    es: "Pizza clásica con tomates frescos y albahaca sobre tabla de madera",
    it: "Pizza classica con pomodori freschi e basilico su tagliere di legno",
    ru: "Классическая пицца со свежими томатами и базиликом на деревянной доске",
  },
  "Pizza végétarienne colorée, garnie de légumes et d’olives": {
    en: "Colourful vegetarian pizza, topped with vegetables and olives",
    es: "Pizza vegetariana colorida, con verduras y aceitunas",
    it: "Pizza vegetariana colorata, con verdure e olive",
    ru: "Яркая вегетарианская пицца с овощами и маслинами",
  },
  "Tiramisu maison présenté sur une assiette": {
    en: "Homemade tiramisu served on a plate",
    es: "Tiramisú casero servido en un plato",
    it: "Tiramisù della casa servito su un piatto",
    ru: "Домашний тирамису на тарелке",
  },
};

// ---------------------------------------------------------------------
// Avis clients — traduits (le prénom et la note restent identiques).
// Clé = prénom, tel qu'utilisé dans `site-data.js`.
// ---------------------------------------------------------------------
const TESTIMONIALS_I18N = {
  Camille: {
    fr: "La meilleure pizza de la Côte d’Azur. Pâte fine et croustillante, ingrédients ultra frais : on sent vraiment le fait-maison.",
    en: "The best pizza on the Côte d’Azur. Thin, crispy crust and ultra-fresh ingredients — you can really taste the homemade quality.",
    es: "La mejor pizza de la Costa Azul. Masa fina y crujiente, ingredientes ultra frescos: se nota que todo es casero.",
    it: "La migliore pizza della Costa Azzurra. Pasta sottile e croccante, ingredienti freschissimi: si sente davvero il fatto in casa.",
    ru: "Лучшая пицца на Лазурном берегу. Тонкое хрустящее тесто, очень свежие ингредиенты — сразу чувствуется, что всё домашнее.",
  },
  Julien: {
    fr: "Service rapide même le samedi soir. La pizza Chorizo est un vrai régal pour les amateurs de sensations fortes.",
    en: "Fast service even on Saturday nights. The Chorizo pizza is a real treat for anyone who likes bold flavours.",
    es: "Servicio rápido incluso los sábados por la noche. La pizza Chorizo es una delicia para los amantes de los sabores fuertes.",
    it: "Servizio rapido anche il sabato sera. La pizza Chorizo è una vera delizia per chi ama i sapori decisi.",
    ru: "Быстрое обслуживание даже в субботний вечер. Пицца Chorizo — настоящее удовольствие для любителей острого.",
  },
  Sophie: {
    fr: "Cadre agréable à deux pas du port, personnel adorable. On y retourne à chaque passage à Beaulieu-sur-Mer.",
    en: "Lovely setting just steps from the harbour, and such friendly staff. We come back every time we’re in Beaulieu-sur-Mer.",
    es: "Ambiente agradable a dos pasos del puerto, personal encantador. Volvemos cada vez que pasamos por Beaulieu-sur-Mer.",
    it: "Ambiente piacevole a due passi dal porto, personale gentilissimo. Ci torniamo ogni volta che siamo a Beaulieu-sur-Mer.",
    ru: "Приятная атмосфера в двух шагах от порта, очень доброжелательный персонал. Возвращаемся сюда каждый раз, бывая в Больё-сюр-Мер.",
  },
};

// ---------------------------------------------------------------------
// Tout le reste du texte de l'interface, par langue.
// ---------------------------------------------------------------------
const I18N = {
  fr: {
    meta: {
      title: "Beaulieu Pizza — Pizzeria artisanale à Beaulieu-sur-Mer",
      description: "Pizzeria artisanale à Beaulieu-sur-Mer : pâte maison, produits frais, cuisson au four traditionnel. Sur place, à emporter ou en livraison. Commande par téléphone au 04 93 01 00 51.",
    },
    ui: {
      skipLink: "Aller au contenu principal",
      orderAriaLabel: "Commander par téléphone",
      order: "Commander",
      openMenu: "Ouvrir le menu",
      langSwitcherLabel: "Choisir la langue",
      address: "Adresse",
      phone: "Téléphone",
      hours: "Horaires",
      services: "Services",
      viewOnMaps: "Voir l’itinéraire sur Google Maps",
      callToOrder: "Appeler pour commander",
      orderUberEats: "Commander sur Uber Eats",
      uberEatsAriaLabel: "Commander sur Uber Eats (nouvel onglet)",
      mapTitle: "Localisation de Beaulieu Pizza sur Google Maps",
      instagramAriaLabel: "Suivre Beaulieu Pizza sur Instagram",
      floatCallAriaLabel: "Appeler Beaulieu Pizza pour commander",
      footerTagline: "Pizzeria artisanale au cœur de Beaulieu-sur-Mer. Pâte maison, produits frais, four traditionnel.",
      footerNav: "Navigation",
      footerAddress: "Coordonnées",
      footerHours: "Horaires",
      rightsReserved: "Tous droits réservés.",
      allMenu: "Toute la carte",
      extraIngredient: "Ingrédient supplémentaire : + 2,00 €.",
    },
    nav: { accueil: "Accueil", carte: "La Carte", histoire: "Notre histoire", contact: "Contact" },
    badges: { bestseller: "Best-seller", spicy: "Épicée", vegetarian: "Végétarienne" },
    days: { mon: "Lundi", tue: "Mardi", wed: "Mercredi", thu: "Jeudi", fri: "Vendredi", sat: "Samedi", sun: "Dimanche" },
    hours: { closed: "Fermé", closedLunch: "Fermé le midi", note: "Fermé le mardi toute la journée. Service du midi également fermé le week-end et en été (juin à septembre)." },
    hero: {
      eyebrow: "Beaulieu-sur-Mer · Four traditionnel",
      title: "La pizza artisanale qui met tout le monde d’accord.",
      text: "Pâte faite maison, produits frais sélectionnés chaque matin et cuisson maîtrisée au four traditionnel : une pizzeria simple et généreuse, fidèle à la tradition italienne.",
      ctaPrimary: "Commander maintenant",
      ctaSecondary: "Voir la carte",
    },
    services: { "sur-place": "Sur place", emporter: "À emporter", livraison: "Livraison" },
    commitments: {
      eyebrow: "Notre engagement",
      title: "Une pizzeria, quatre promesses",
      items: [
        { icon: "wheat", title: "Pâte préparée maison", text: "Pétrie et préparée maison, chaque jour, sur place." },
        { icon: "leaf", title: "Ingrédients frais et sélectionnés", text: "Légumes, charcuteries et fromages choisis auprès de producteurs locaux." },
        { icon: "flame", title: "Cuisson traditionnelle", text: "Un four à plus de 400°C pour une croûte croustillante et une garniture fondante." },
        { icon: "phone-call", title: "Commande rapide par téléphone", text: "Un appel suffit : nous préparons votre pizza pendant que vous patientez." },
      ],
    },
    popular: { eyebrow: "Nos meilleures ventes", title: "Ce que nos clients commandent le plus", intro: "Nos 6 best-sellers — la carte complète se trouve juste en dessous." },
    menu: { eyebrow: "La carte", title: "Toute la carte, catégorie par catégorie", intro: "Filtrez par catégorie pour retrouver rapidement ce que vous cherchez.", filterAriaLabel: "Filtrer la carte par catégorie" },
    categories: {
      classiques: { label: "Classiques", intro: "Les incontournables de la maison." },
      specialites: { label: "Spécialités", intro: "Les créations de la maison, plus généreuses." },
      mer: { label: "Poissons & fruits de mer", intro: "Pour les amateurs de saveurs marines." },
      vegetariennes: { label: "Végétariennes", intro: "Sans viande ni poisson. Voir aussi, dans nos Classiques, la Marguerite, la Forestière, les Poivrons et les Oignons — et La Chef, dans nos Spécialités." },
      desserts: { label: "Desserts", intro: "Pour finir en douceur." },
      boissons: { label: "Boissons", intro: "Pour accompagner votre pizza, sur place ou à emporter." },
    },
    about: {
      eyebrow: "Notre histoire",
      titlePrefix: "Une pizzeria de quartier, depuis",
      paragraphs: [
        "Depuis 2014, Beaulieu Pizza prépare chaque jour ses pizzas au cœur de Beaulieu-sur-Mer, à deux pas du port. Une pâte pétrie et préparée maison, sur place, et des produits frais choisis chaque matin : rien n’est laissé au hasard.",
        "Notre four traditionnel, chauffé à plus de 400°C, donne à chaque pizza sa croûte fine et croustillante, sa garniture fondante et ce goût de cuisson au feu qu’aucune machine ne reproduit. Une cuisine simple et généreuse, fidèle à la tradition italienne, pensée pour être dégustée sur place, à emporter ou en livraison.",
      ],
      stats: { years: "Années à Beaulieu", homemade: "Pâte maison", oven: "Four traditionnel" },
    },
    testimonials: { eyebrow: "Avis clients", title: "Ce qu’en pensent nos habitués", ratingAriaLabel: (n) => `Note : ${n} sur 5` },
    contact: { eyebrow: "Informations pratiques", title: "Nous trouver, nous appeler" },
    legal: [
      "H.O.P (SARL), exploitant sous l’enseigne « Beaulieu Pizza ».",
      "Gérant et directeur de la publication : Harold Gardet.",
      "Siège social : 11 Bd du Maréchal Joffre, 06310 Beaulieu-sur-Mer.",
      "SIRET : 812 512 952 00019 · N° TVA intracommunautaire : FR66 812 512 952.",
      "Téléphone : 04 93 01 00 51.",
      "Hébergement : Hostinger International Ltd, 61 Lordou Vironos Street, 6023 Larnaca, Chypre.",
      "Ce site ne collecte aucune donnée de paiement ; toute commande s’effectue par téléphone.",
      "Conception et réalisation du site : Alexandre Jacquel.",
    ],
  },

  en: {
    meta: {
      title: "Beaulieu Pizza — Artisan Pizzeria in Beaulieu-sur-Mer",
      description: "Artisan pizzeria in Beaulieu-sur-Mer: homemade dough, fresh produce, cooked in a traditional oven. Dine in, takeaway or delivery. Order by phone: 04 93 01 00 51.",
    },
    ui: {
      skipLink: "Skip to main content",
      orderAriaLabel: "Order by phone",
      order: "Order",
      openMenu: "Open menu",
      langSwitcherLabel: "Choose language",
      address: "Address",
      phone: "Phone",
      hours: "Opening hours",
      services: "Services",
      viewOnMaps: "Get directions on Google Maps",
      callToOrder: "Call to order",
      orderUberEats: "Order on Uber Eats",
      uberEatsAriaLabel: "Order on Uber Eats (opens in a new tab)",
      mapTitle: "Beaulieu Pizza’s location on Google Maps",
      instagramAriaLabel: "Follow Beaulieu Pizza on Instagram",
      floatCallAriaLabel: "Call Beaulieu Pizza to order",
      footerTagline: "Artisan pizzeria in the heart of Beaulieu-sur-Mer. Homemade dough, fresh produce, traditional oven.",
      footerNav: "Navigation",
      footerAddress: "Contact",
      footerHours: "Opening hours",
      rightsReserved: "All rights reserved.",
      allMenu: "Whole menu",
      extraIngredient: "Extra ingredient: + €2.00.",
    },
    nav: { accueil: "Home", carte: "Menu", histoire: "Our Story", contact: "Contact" },
    badges: { bestseller: "Best-seller", spicy: "Spicy", vegetarian: "Vegetarian" },
    days: { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" },
    hours: { closed: "Closed", closedLunch: "Closed at lunch", note: "Closed all day Tuesday. Also closed for lunch on weekends and in summer (June to September)." },
    hero: {
      eyebrow: "Beaulieu-sur-Mer · Traditional wood oven",
      title: "The artisan pizza everyone agrees on.",
      text: "Homemade dough, fresh produce selected every morning, and precise cooking in our traditional oven: a simple, generous pizzeria, true to Italian tradition.",
      ctaPrimary: "Order now",
      ctaSecondary: "View the menu",
    },
    services: { "sur-place": "Dine in", emporter: "Takeaway", livraison: "Delivery" },
    commitments: {
      eyebrow: "Our commitment",
      title: "One pizzeria, four promises",
      items: [
        { icon: "wheat", title: "Homemade dough", text: "Kneaded and prepared by hand, every day, on site." },
        { icon: "leaf", title: "Fresh, hand-picked ingredients", text: "Vegetables, cured meats and cheeses sourced from local producers." },
        { icon: "flame", title: "Traditional baking", text: "A wood oven over 400°C for a crisp crust and a melting topping." },
        { icon: "phone-call", title: "Quick ordering by phone", text: "One call is all it takes: we start your pizza while you wait." },
      ],
    },
    popular: { eyebrow: "Our best-sellers", title: "What our customers order most", intro: "Our 6 best-sellers — the full menu is just below." },
    menu: { eyebrow: "The menu", title: "The full menu, category by category", intro: "Filter by category to quickly find what you’re looking for.", filterAriaLabel: "Filter the menu by category" },
    categories: {
      classiques: { label: "Classics", intro: "The house essentials." },
      specialites: { label: "Specialities", intro: "Our house creations, extra generous." },
      mer: { label: "Fish & Seafood", intro: "For lovers of the sea." },
      vegetariennes: { label: "Vegetarian", intro: "No meat, no fish. Also see, in our Classics, the Marguerite, Forestière, Poivrons and Oignons — and La Chef, in our Specialities." },
      desserts: { label: "Desserts", intro: "A sweet ending." },
      boissons: { label: "Drinks", intro: "To go with your pizza, whether you dine in or take away." },
    },
    about: {
      eyebrow: "Our story",
      titlePrefix: "A neighbourhood pizzeria, since",
      paragraphs: [
        "Since 2014, Beaulieu Pizza has been making pizzas every day in the heart of Beaulieu-sur-Mer, just steps from the harbour. Dough kneaded and made by hand on site, and fresh produce chosen every morning: nothing is left to chance.",
        "Our traditional oven, heated to over 400°C, gives every pizza its thin, crisp crust, its melting topping and that wood-fired taste no machine can copy. Simple, generous cooking, true to Italian tradition, made to enjoy dine-in, takeaway or delivered.",
      ],
      stats: { years: "Years in Beaulieu", homemade: "Homemade dough", oven: "Traditional oven" },
    },
    testimonials: { eyebrow: "Customer reviews", title: "What our regulars say", ratingAriaLabel: (n) => `Rating: ${n} out of 5` },
    contact: { eyebrow: "Practical information", title: "Find us, call us" },
    legal: [
      "H.O.P (SARL, French limited liability company), trading as “Beaulieu Pizza”.",
      "Manager and publication director: Harold Gardet.",
      "Registered office: 11 Bd du Maréchal Joffre, 06310 Beaulieu-sur-Mer, France.",
      "Company registration (SIRET): 812 512 952 00019 · Intra-EU VAT number: FR66 812 512 952.",
      "Phone: 04 93 01 00 51.",
      "Hosting: Hostinger International Ltd, 61 Lordou Vironos Street, 6023 Larnaca, Cyprus.",
      "This site collects no payment data; all orders are placed by phone.",
      "Site design: Alexandre Jacquel.",
    ],
  },

  es: {
    meta: {
      title: "Beaulieu Pizza — Pizzería artesanal en Beaulieu-sur-Mer",
      description: "Pizzería artesanal en Beaulieu-sur-Mer: masa casera, productos frescos, horno tradicional. Para comer aquí, para llevar o a domicilio. Pedidos por teléfono: 04 93 01 00 51.",
    },
    ui: {
      skipLink: "Ir al contenido principal",
      orderAriaLabel: "Pedir por teléfono",
      order: "Pedir",
      openMenu: "Abrir menú",
      langSwitcherLabel: "Elegir idioma",
      address: "Dirección",
      phone: "Teléfono",
      hours: "Horarios",
      services: "Servicios",
      viewOnMaps: "Ver ruta en Google Maps",
      callToOrder: "Llamar para pedir",
      orderUberEats: "Pedir en Uber Eats",
      uberEatsAriaLabel: "Pedir en Uber Eats (nueva pestaña)",
      mapTitle: "Ubicación de Beaulieu Pizza en Google Maps",
      instagramAriaLabel: "Seguir a Beaulieu Pizza en Instagram",
      floatCallAriaLabel: "Llamar a Beaulieu Pizza para pedir",
      footerTagline: "Pizzería artesanal en el corazón de Beaulieu-sur-Mer. Masa casera, productos frescos, horno tradicional.",
      footerNav: "Navegación",
      footerAddress: "Contacto",
      footerHours: "Horarios",
      rightsReserved: "Todos los derechos reservados.",
      allMenu: "Toda la carta",
      extraIngredient: "Ingrediente extra: + 2,00 €.",
    },
    nav: { accueil: "Inicio", carte: "La Carta", histoire: "Nuestra Historia", contact: "Contacto" },
    badges: { bestseller: "Más vendida", spicy: "Picante", vegetarian: "Vegetariana" },
    days: { mon: "Lunes", tue: "Martes", wed: "Miércoles", thu: "Jueves", fri: "Viernes", sat: "Sábado", sun: "Domingo" },
    hours: { closed: "Cerrado", closedLunch: "Cerrado a mediodía", note: "Cerrado todo el día los martes. También cerrado a mediodía los fines de semana y en verano (de junio a septiembre)." },
    hero: {
      eyebrow: "Beaulieu-sur-Mer · Horno tradicional",
      title: "La pizza artesanal que pone de acuerdo a todos.",
      text: "Masa casera, productos frescos seleccionados cada mañana y una cocción precisa en horno tradicional: una pizzería sencilla y generosa, fiel a la tradición italiana.",
      ctaPrimary: "Pedir ahora",
      ctaSecondary: "Ver la carta",
    },
    services: { "sur-place": "Para comer aquí", emporter: "Para llevar", livraison: "A domicilio" },
    commitments: {
      eyebrow: "Nuestro compromiso",
      title: "Una pizzería, cuatro promesas",
      items: [
        { icon: "wheat", title: "Masa preparada de forma casera", text: "Amasada y preparada a mano, cada día, en el local." },
        { icon: "leaf", title: "Ingredientes frescos y seleccionados", text: "Verduras, embutidos y quesos elegidos junto a productores locales." },
        { icon: "flame", title: "Cocción tradicional", text: "Un horno a más de 400°C para una masa crujiente y un relleno fundido." },
        { icon: "phone-call", title: "Pedido rápido por teléfono", text: "Una llamada basta: preparamos su pizza mientras espera." },
      ],
    },
    popular: { eyebrow: "Nuestras más vendidas", title: "Lo que más piden nuestros clientes", intro: "Nuestras 6 más vendidas — la carta completa está justo debajo." },
    menu: { eyebrow: "La carta", title: "Toda la carta, categoría por categoría", intro: "Filtre por categoría para encontrar rápidamente lo que busca.", filterAriaLabel: "Filtrar la carta por categoría" },
    categories: {
      classiques: { label: "Clásicas", intro: "Los imprescindibles de la casa." },
      specialites: { label: "Especialidades", intro: "Las creaciones de la casa, más generosas." },
      mer: { label: "Pescados y mariscos", intro: "Para los amantes del mar." },
      vegetariennes: { label: "Vegetarianas", intro: "Sin carne ni pescado. Vea también, entre nuestras Clásicas, la Marguerite, la Forestière, la Poivrons y la Oignons — y La Chef, entre nuestras Especialidades." },
      desserts: { label: "Postres", intro: "Para terminar con dulzura." },
      boissons: { label: "Bebidas", intro: "Para acompañar su pizza, para comer aquí o para llevar." },
    },
    about: {
      eyebrow: "Nuestra historia",
      titlePrefix: "Una pizzería de barrio, desde",
      paragraphs: [
        "Desde 2014, Beaulieu Pizza prepara cada día sus pizzas en el corazón de Beaulieu-sur-Mer, a dos pasos del puerto. Una masa amasada y preparada de forma casera, en el local, y productos frescos elegidos cada mañana: nada se deja al azar.",
        "Nuestro horno tradicional, calentado a más de 400°C, da a cada pizza su masa fina y crujiente, su relleno fundido y ese sabor a cocción al fuego que ninguna máquina reproduce. Una cocina sencilla y generosa, fiel a la tradición italiana, pensada para disfrutarse en el local, para llevar o a domicilio.",
      ],
      stats: { years: "Años en Beaulieu", homemade: "Masa casera", oven: "Horno tradicional" },
    },
    testimonials: { eyebrow: "Opiniones de clientes", title: "Lo que opinan nuestros habituales", ratingAriaLabel: (n) => `Valoración: ${n} de 5` },
    contact: { eyebrow: "Información práctica", title: "Encuéntrenos, llámenos" },
    legal: [
      "H.O.P (SARL, sociedad de responsabilidad limitada francesa), que opera bajo el nombre comercial «Beaulieu Pizza».",
      "Gerente y director de publicación: Harold Gardet.",
      "Domicilio social: 11 Bd du Maréchal Joffre, 06310 Beaulieu-sur-Mer, Francia.",
      "Número de registro (SIRET): 812 512 952 00019 · Número de IVA intracomunitario: FR66 812 512 952.",
      "Teléfono: 04 93 01 00 51.",
      "Alojamiento: Hostinger International Ltd, 61 Lordou Vironos Street, 6023 Larnaca, Chipre.",
      "Este sitio no recopila ningún dato de pago; todos los pedidos se realizan por teléfono.",
      "Diseño del sitio: Alexandre Jacquel.",
    ],
  },

  it: {
    meta: {
      title: "Beaulieu Pizza — Pizzeria artigianale a Beaulieu-sur-Mer",
      description: "Pizzeria artigianale a Beaulieu-sur-Mer: impasto fatto in casa, prodotti freschi, cottura nel forno tradizionale. Sul posto, da asporto o a domicilio. Ordini per telefono: 04 93 01 00 51.",
    },
    ui: {
      skipLink: "Vai al contenuto principale",
      orderAriaLabel: "Ordina per telefono",
      order: "Ordina",
      openMenu: "Apri il menù",
      langSwitcherLabel: "Scegli la lingua",
      address: "Indirizzo",
      phone: "Telefono",
      hours: "Orari",
      services: "Servizi",
      viewOnMaps: "Vedi il percorso su Google Maps",
      callToOrder: "Chiama per ordinare",
      orderUberEats: "Ordina su Uber Eats",
      uberEatsAriaLabel: "Ordina su Uber Eats (nuova scheda)",
      mapTitle: "Posizione di Beaulieu Pizza su Google Maps",
      instagramAriaLabel: "Segui Beaulieu Pizza su Instagram",
      floatCallAriaLabel: "Chiama Beaulieu Pizza per ordinare",
      footerTagline: "Pizzeria artigianale nel cuore di Beaulieu-sur-Mer. Impasto fatto in casa, prodotti freschi, forno tradizionale.",
      footerNav: "Navigazione",
      footerAddress: "Contatti",
      footerHours: "Orari",
      rightsReserved: "Tutti i diritti riservati.",
      allMenu: "Tutto il menù",
      extraIngredient: "Ingrediente extra: + 2,00 €.",
    },
    nav: { accueil: "Home", carte: "Il Menù", histoire: "La Nostra Storia", contact: "Contatti" },
    badges: { bestseller: "Più venduta", spicy: "Piccante", vegetarian: "Vegetariana" },
    days: { mon: "Lunedì", tue: "Martedì", wed: "Mercoledì", thu: "Giovedì", fri: "Venerdì", sat: "Sabato", sun: "Domenica" },
    hours: { closed: "Chiuso", closedLunch: "Chiuso a pranzo", note: "Chiuso tutto il giorno il martedì. Chiuso anche a pranzo nei fine settimana e in estate (da giugno a settembre)." },
    hero: {
      eyebrow: "Beaulieu-sur-Mer · Forno tradizionale",
      title: "La pizza artigianale che mette tutti d’accordo.",
      text: "Impasto fatto in casa, prodotti freschi selezionati ogni mattina e cottura sapiente nel forno tradizionale: una pizzeria semplice e generosa, fedele alla tradizione italiana.",
      ctaPrimary: "Ordina ora",
      ctaSecondary: "Vedi il menù",
    },
    services: { "sur-place": "Sul posto", emporter: "Da asporto", livraison: "A domicilio" },
    commitments: {
      eyebrow: "Il nostro impegno",
      title: "Una pizzeria, quattro promesse",
      items: [
        { icon: "wheat", title: "Impasto preparato in casa", text: "Lavorato e preparato a mano, ogni giorno, sul posto." },
        { icon: "leaf", title: "Ingredienti freschi e selezionati", text: "Verdure, salumi e formaggi scelti da produttori locali." },
        { icon: "flame", title: "Cottura tradizionale", text: "Un forno oltre 400°C per una crosta croccante e un ripieno filante." },
        { icon: "phone-call", title: "Ordine rapido per telefono", text: "Basta una chiamata: prepariamo la vostra pizza mentre aspettate." },
      ],
    },
    popular: { eyebrow: "Le più vendute", title: "Ciò che i nostri clienti ordinano di più", intro: "Le nostre 6 più vendute — il menù completo si trova appena sotto." },
    menu: { eyebrow: "Il menù", title: "Tutto il menù, categoria per categoria", intro: "Filtra per categoria per trovare rapidamente ciò che cerchi.", filterAriaLabel: "Filtra il menù per categoria" },
    categories: {
      classiques: { label: "Classiche", intro: "Gli intramontabili della casa." },
      specialites: { label: "Specialità", intro: "Le creazioni della casa, più generose." },
      mer: { label: "Pesce e frutti di mare", intro: "Per gli amanti del mare." },
      vegetariennes: { label: "Vegetariane", intro: "Senza carne né pesce. Vedi anche, tra le nostre Classiche, la Marguerite, la Forestière, la Poivrons e la Oignons — e La Chef, tra le nostre Specialità." },
      desserts: { label: "Dolci", intro: "Per finire in dolcezza." },
      boissons: { label: "Bevande", intro: "Per accompagnare la vostra pizza, sul posto o da asporto." },
    },
    about: {
      eyebrow: "La nostra storia",
      titlePrefix: "Una pizzeria di quartiere, dal",
      paragraphs: [
        "Dal 2014, Beaulieu Pizza prepara ogni giorno le sue pizze nel cuore di Beaulieu-sur-Mer, a due passi dal porto. Un impasto lavorato e preparato in casa, sul posto, e prodotti freschi scelti ogni mattina: niente è lasciato al caso.",
        "Il nostro forno tradizionale, riscaldato oltre i 400°C, dà a ogni pizza la sua crosta sottile e croccante, il suo ripieno filante e quel gusto di cottura a fuoco vivo che nessuna macchina riproduce. Una cucina semplice e generosa, fedele alla tradizione italiana, pensata per essere gustata sul posto, da asporto o a domicilio.",
      ],
      stats: { years: "Anni a Beaulieu", homemade: "Impasto fatto in casa", oven: "Forno tradizionale" },
    },
    testimonials: { eyebrow: "Recensioni clienti", title: "Cosa ne pensano i nostri habitué", ratingAriaLabel: (n) => `Voto: ${n} su 5` },
    contact: { eyebrow: "Informazioni pratiche", title: "Come trovarci, come chiamarci" },
    legal: [
      "H.O.P (SARL, società a responsabilità limitata francese), operante con il nome commerciale «Beaulieu Pizza».",
      "Gerente e direttore della pubblicazione: Harold Gardet.",
      "Sede legale: 11 Bd du Maréchal Joffre, 06310 Beaulieu-sur-Mer, Francia.",
      "Numero di registrazione (SIRET): 812 512 952 00019 · Partita IVA intracomunitaria: FR66 812 512 952.",
      "Telefono: 04 93 01 00 51.",
      "Hosting: Hostinger International Ltd, 61 Lordou Vironos Street, 6023 Larnaca, Cipro.",
      "Questo sito non raccoglie alcun dato di pagamento; tutti gli ordini si effettuano per telefono.",
      "Design del sito: Alexandre Jacquel.",
    ],
  },

  ru: {
    meta: {
      title: "Beaulieu Pizza — пиццерия ручной работы в Больё-сюр-Мер",
      description: "Пиццерия ручной работы в Больё-сюр-Мер: домашнее тесто, свежие продукты, выпечка в традиционной печи. В зале, навынос или с доставкой. Заказ по телефону: 04 93 01 00 51.",
    },
    ui: {
      skipLink: "Перейти к основному содержанию",
      orderAriaLabel: "Заказать по телефону",
      order: "Заказать",
      openMenu: "Открыть меню",
      langSwitcherLabel: "Выбрать язык",
      address: "Адрес",
      phone: "Телефон",
      hours: "Часы работы",
      services: "Услуги",
      viewOnMaps: "Маршрут на Google Maps",
      callToOrder: "Позвонить, чтобы заказать",
      orderUberEats: "Заказать через Uber Eats",
      uberEatsAriaLabel: "Заказать через Uber Eats (новая вкладка)",
      mapTitle: "Расположение Beaulieu Pizza на Google Maps",
      instagramAriaLabel: "Читать Beaulieu Pizza в Instagram",
      floatCallAriaLabel: "Позвонить в Beaulieu Pizza, чтобы заказать",
      footerTagline: "Пиццерия ручной работы в самом сердце Больё-сюр-Мер. Домашнее тесто, свежие продукты, традиционная печь.",
      footerNav: "Навигация",
      footerAddress: "Контакты",
      footerHours: "Часы работы",
      rightsReserved: "Все права защищены.",
      allMenu: "Всё меню",
      extraIngredient: "Дополнительный ингредиент: + 2,00 €.",
    },
    nav: { accueil: "Главная", carte: "Меню", histoire: "О нас", contact: "Контакты" },
    badges: { bestseller: "Хит продаж", spicy: "Острое", vegetarian: "Вегетарианское" },
    days: { mon: "Понедельник", tue: "Вторник", wed: "Среда", thu: "Четверг", fri: "Пятница", sat: "Суббота", sun: "Воскресенье" },
    hours: { closed: "Закрыто", closedLunch: "Закрыто днём", note: "По вторникам закрыто весь день. По выходным и летом (с июня по сентябрь) также закрыто днём." },
    hero: {
      eyebrow: "Больё-сюр-Мер · Традиционная печь",
      title: "Домашняя пицца, с которой согласны все.",
      text: "Домашнее тесто, свежие продукты, отобранные каждое утро, и точная выпечка в традиционной печи: простая и щедрая пиццерия, верная итальянским традициям.",
      ctaPrimary: "Заказать сейчас",
      ctaSecondary: "Смотреть меню",
    },
    services: { "sur-place": "В зале", emporter: "Навынос", livraison: "Доставка" },
    commitments: {
      eyebrow: "Наши принципы",
      title: "Одна пиццерия, четыре обещания",
      items: [
        { icon: "wheat", title: "Домашнее тесто", text: "Замешивается и готовится вручную, каждый день, на месте." },
        { icon: "leaf", title: "Свежие, отобранные ингредиенты", text: "Овощи, колбасные изделия и сыры от местных производителей." },
        { icon: "flame", title: "Традиционная выпечка", text: "Печь свыше 400°C для хрустящей корочки и тающей начинки." },
        { icon: "phone-call", title: "Быстрый заказ по телефону", text: "Достаточно одного звонка: мы начинаем готовить вашу пиццу, пока вы ждёте." },
      ],
    },
    popular: { eyebrow: "Наши хиты продаж", title: "Что чаще всего заказывают наши клиенты", intro: "Наши 6 хитов продаж — полное меню чуть ниже." },
    menu: { eyebrow: "Меню", title: "Полное меню, по категориям", intro: "Отфильтруйте по категории, чтобы быстро найти нужное.", filterAriaLabel: "Фильтр меню по категориям" },
    categories: {
      classiques: { label: "Классика", intro: "Основа меню." },
      specialites: { label: "Фирменные", intro: "Авторские пиццы дома, ещё щедрее." },
      mer: { label: "Рыба и морепродукты", intro: "Для любителей морских вкусов." },
      vegetariennes: { label: "Вегетарианские", intro: "Без мяса и рыбы. Смотрите также в разделе «Классика»: Marguerite, Forestière, Poivrons и Oignons, а в «Фирменных» — La Chef." },
      desserts: { label: "Десерты", intro: "Сладкое завершение." },
      boissons: { label: "Напитки", intro: "Отличное дополнение к пицце — в зале или с собой." },
    },
    about: {
      eyebrow: "О нас",
      titlePrefix: "Пиццерия по соседству, с",
      paragraphs: [
        "С 2014 года Beaulieu Pizza каждый день готовит пиццу в самом сердце Больё-сюр-Мер, в двух шагах от порта. Тесто замешивается и готовится вручную, на месте, а свежие продукты отбираются каждое утро: здесь ничего не оставлено на волю случая.",
        "Наша традиционная печь, разогретая свыше 400°C, придаёт каждой пицце тонкую хрустящую корочку, тающую начинку и тот самый вкус выпечки на огне, который не воспроизвести никакой машиной. Простая и щедрая кухня, верная итальянским традициям, создана для того, чтобы её пробовали в зале, навынос или с доставкой.",
      ],
      stats: { years: "Лет в Больё", homemade: "Домашнее тесто", oven: "Традиционная печь" },
    },
    testimonials: { eyebrow: "Отзывы клиентов", title: "Что говорят наши постоянные гости", ratingAriaLabel: (n) => `Оценка: ${n} из 5` },
    contact: { eyebrow: "Практическая информация", title: "Как нас найти и как нам позвонить" },
    legal: [
      "H.O.P (SARL, французское общество с ограниченной ответственностью), торговое название «Beaulieu Pizza».",
      "Управляющий и директор публикации: Harold Gardet.",
      "Юридический адрес: 11 Bd du Maréchal Joffre, 06310 Beaulieu-sur-Mer, Франция.",
      "Регистрационный номер (SIRET): 812 512 952 00019 · Номер плательщика НДС в ЕС: FR66 812 512 952.",
      "Телефон: 04 93 01 00 51.",
      "Хостинг: Hostinger International Ltd, 61 Lordou Vironos Street, 6023 Larnaca, Кипр.",
      "Сайт не собирает платёжные данные; все заказы оформляются по телефону.",
      "Дизайн сайта: Alexandre Jacquel.",
    ],
  },
};
