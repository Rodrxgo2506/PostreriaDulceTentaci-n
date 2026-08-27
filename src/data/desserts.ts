import { Dessert } from '../types';

export const DESSERTS_DATA: Dessert[] = [
  {
    id: 'torta-tres-leches',
    name: 'Torta de Tres Leches',
    category: 'postres',
    categoryName: 'Pastelería Clásica',
    price: 10.00,
    originalPrice: 12.00,
    shortDescription: 'Bizcocho esponjoso embebido en la clásica y cremosa mezcla de tres leches con merengue suave y canela.',
    fullDescription: 'Nuestra Torta de Tres Leches es un deleite irresistible. Preparada con un bizcochuelo sumamente aireado y absorbente, infusionado pacientemente en nuestra receta secreta de leche evaporada, leche condensada y crema de leche fresca. Decorada con un copete de merengue sedoso y un toque aromático de canela espolvoreada.',
    image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=1000&q=85',
    secondaryImages: [
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=1000&q=85'
    ],
    servings: '1 porción individual generosa',
    preparationTime: 'Disponible para Entrega Inmediata',
    rating: 5.0,
    reviewCount: 48,
    tags: ['Especialidad', 'Clásico Favorito', 'Hecho con Amor'],
    ingredients: ['Leche evaporada', 'Leche condensada', 'Crema de leche', 'Bizcocho artesanal', 'Merengue batido', 'Canela molida'],
    allergens: ['Lácteos', 'Gluten', 'Huevos'],
    isBestSeller: true,
    isNew: false,
    calories: '320 kcal'
  },
  {
    id: 'crema-volteada',
    name: 'Crema Volteada',
    category: 'postres',
    categoryName: 'Tradición Casera',
    price: 10.00,
    originalPrice: 12.00,
    shortDescription: 'Delicada y suave crema horneada a baño maría con abundante caramelo dorado y notas sutiles de vainilla.',
    fullDescription: 'El postre casero por excelencia llevado a su máxima suavidad. Con una textura aterciopelada que se deshace en el paladar, elaborada con huevos frescos de granja, leche condensada y leche entera de primera calidad, bañada en un caramelo dorado y brillante con el balance exacto de dulzor.',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1000&q=85',
    secondaryImages: [
      'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1000&q=85'
    ],
    servings: '1 porción individual generosa',
    preparationTime: 'Disponible para Entrega Inmediata',
    rating: 4.9,
    reviewCount: 42,
    tags: ['Tradicional', 'Textura Suave', 'Caramelo Rubio'],
    ingredients: ['Huevos frescos de granja', 'Leche condensada', 'Leche evaporada', 'Caramelo de azúcar rubia', 'Esencia pura de vainilla'],
    allergens: ['Lácteos', 'Huevos'],
    isBestSeller: true,
    calories: '280 kcal'
  },
  {
    id: 'cheesecake-maracuya',
    name: 'Cheesecake de Maracuyá',
    category: 'postres',
    categoryName: 'Especialidades',
    price: 10.00,
    originalPrice: 12.00,
    shortDescription: 'Cremoso cheesecake con base crocante de galleta y coulis brillante de maracuyá con sus semillas naturales.',
    fullDescription: 'El balance perfecto entre la cremosidad rica del queso crema y el toque tropical y refrescante del maracuyá. Montado sobre una base crujiente de galletas de mantequilla y coronado con una generosa salsa brillante de fruta natural con semillas.',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=1000&q=85',
    secondaryImages: [
      'https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=1000&q=85'
    ],
    servings: '1 porción individual generosa',
    preparationTime: 'Disponible para Entrega Inmediata',
    rating: 5.0,
    reviewCount: 56,
    tags: ['Toque Cítrico', 'Cremoso', 'Fruta Natural'],
    ingredients: ['Queso crema natural', 'Pulpa de maracuyá fresco', 'Base de galleta crocante', 'Mantequilla', 'Toque cítrico'],
    allergens: ['Lácteos', 'Gluten'],
    isBestSeller: true,
    isNew: true,
    calories: '310 kcal'
  }
];

export const CATEGORIES = [
  { id: 'todos', name: 'Todos los Postres', icon: 'Sparkles' },
  { id: 'postres', name: 'Postres del Día', icon: 'Cake' },
] as const;

export const REVIEWS = [
  {
    id: 1,
    name: 'Lucía Mendoza',
    date: 'Hace 2 días',
    rating: 5,
    comment: '¡La Torta de Tres Leches es una maravilla! Súper húmeda y no empalaga nada. Además el delivery llegó volando y gratis porque pedí 3 postres para la familia.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80',
    boughtItem: 'Torta de Tres Leches'
  },
  {
    id: 2,
    name: 'Carlos Benavides',
    date: 'Hace 4 días',
    rating: 5,
    comment: 'La crema volteada tiene la textura exacta, suave y con harto caramelo como debe ser. Excelente atención por WhatsApp.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    boughtItem: 'Crema Volteada'
  },
  {
    id: 3,
    name: 'Fiorella Ramos',
    date: 'Hace 1 semana',
    rating: 5,
    comment: 'El cheesecake de maracuyá es mi favorito absoluto, ese toque ácido con el queso crema es perfecto. 100% recomendados.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    boughtItem: 'Cheesecake de Maracuyá'
  }
];

export const GALLERY_ITEMS: { id: string; title: string; subtitle: string; image: string; tag: string }[] = [
  {
    id: 'g1',
    title: 'Torta de Tres Leches',
    subtitle: 'Bañada en la clásica mezcla casera con merengue y canela',
    image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=1000&q=85',
    tag: 'Tres Leches'
  },
  {
    id: 'g2',
    title: 'Crema Volteada Acaramelada',
    subtitle: 'Textura suavecita y cremosa horneada con caramelo rubio',
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1000&q=85',
    tag: 'Crema Volteada'
  },
  {
    id: 'g3',
    title: 'Cheesecake de Maracuyá',
    subtitle: 'Base crocante de galleta y coulis natural con semillas',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=1000&q=85',
    tag: 'Cheesecake'
  },
  {
    id: 'g4',
    title: 'Entrega Inmediata a Domicilio',
    subtitle: 'Delivery gratis a partir de 2 unidades directamente a tu puerta',
    image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1000&q=85',
    tag: 'Delivery Gratis'
  }
];

// Business Information
export const BAKERY_NAME = 'Dulce Tentación';
export const BAKERY_SLOGAN = 'Postres que enamoran';
export const BAKERY_SUBTITLE = '¡Hechos con amor, para endulzar tu día!';
export const BAKERY_PHONE_NUMBER = '51965255201'; // Peru international format: +51 965 255 201
export const BAKERY_PHONE_FORMATTED = '965 255 201';
export const BAKERY_EMAIL = 'pedidos@dulcetentacion.pe';
export const BAKERY_ADDRESS = 'Jirón Manco Cápac 653';
export const BAKERY_REFERENCE = 'Por el Seguro de Salud';
export const BAKERY_HOURS = 'Lunes a Domingo: 10:00 AM - 9:00 PM';
export const DELIVERY_PROMO_THRESHOLD = 2; // Delivery free with 2 or more units
export const DEFAULT_DELIVERY_FEE = 4.00; // S/ 4.00 if only 1 unit
