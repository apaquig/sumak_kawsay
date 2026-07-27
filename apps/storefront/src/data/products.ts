import type { Language } from '../lib/i18n';

export type TranslationStatus = 'pending' | 'machine-translated' | 'approved';

export interface ProductTranslation {
  name: string;
  shortDescription: string;
  description: string;
  materials: string;
  technique: string;
  careInstructions: string;
  story: string;
  seoTitle: string;
  seoDescription: string;
}

export interface Product {
  id: string;
  slug: string;
  category: { slug: string; label: Record<Language, string> };
  image: { url: string; width: number; height: number; alt: Record<Language, string> };
  origin: string;
  dimensions: string;
  featured: boolean;
  published: boolean;
  rating?: number;
  reviewsCount?: number;
  priceEcuador?: number;
  priceUSA?: number;
  translations: Record<Language, ProductTranslation>;
  translationStatus: Record<Language, TranslationStatus>;
  model3d: { enabled: boolean; url?: string; posterUrl?: string; autoRotate: boolean; scale: number };
  virtualTryOn: { enabled: boolean; overlayImageUrl?: string };
}

export const products: Product[] = [
  {
    id: 'sk-collar-001',
    slug: 'collar-geometria-viva',
    category: { slug: 'collares', label: { es: 'Collares', en: 'Necklaces' } },
    image: {
      url: '/images/collar-saraguro.webp',
      width: 900,
      height: 900,
      alt: {
        es: 'Collar ancho de mullos con motivos geométricos multicolores',
        en: 'Wide beaded necklace with multicolor geometric motifs',
      },
    },
    origin: 'Saraguro, Loja, Ecuador',
    dimensions: 'Información pendiente de verificación',
    featured: true,
    published: true,
    rating: 5.0,
    reviewsCount: 28,
    priceEcuador: 35.00,
    priceUSA: 45.00,
    translations: {
      es: {
        name: 'Collar Geometría Viva',
        shortDescription: 'Collar de mullos construido en patrones geométricos de color.',
        description: 'Una pieza de presencia amplia, elaborada cuenta por cuenta y diseñada para destacar el ritmo de sus formas geométricas.',
        materials: 'Mullos de vidrio e hilo para bisutería. Información por confirmar en el inventario.',
        technique: 'Tejido manual con mullos. La técnica específica debe verificarse con la persona artesana.',
        careInstructions: 'Guardar seco y separado. Evitar perfumes, químicos y tirones.',
        story: 'Esta ficha demuestra cómo se documentará el origen y el proceso de cada pieza antes de publicarla.',
        seoTitle: 'Collar Geometría Viva | Sumak Kawsay',
        seoDescription: 'Conoce el Collar Geometría Viva, una pieza artesanal de mullos presentada por Sumak Kawsay en Saraguro, Loja.',
      },
      en: {
        name: 'Living Geometry Necklace',
        shortDescription: 'A beaded necklace built from colorful geometric patterns.',
        description: 'A bold piece made bead by bead to showcase the rhythm of its geometric forms.',
        materials: 'Glass beads and jewelry thread. Inventory details must be confirmed.',
        technique: 'Handwoven beadwork. The specific technique must be verified with the artisan.',
        careInstructions: 'Keep dry and store separately. Avoid perfume, chemicals, and pulling.',
        story: 'This sample shows how the origin and process of every piece will be documented before publication.',
        seoTitle: 'Living Geometry Necklace | Sumak Kawsay',
        seoDescription: 'Discover the Living Geometry Necklace, a handcrafted beadwork piece presented by Sumak Kawsay in Saraguro, Loja.',
      },
    },
    translationStatus: { es: 'approved', en: 'approved' },
    model3d: { enabled: false, autoRotate: true, scale: 1 },
    virtualTryOn: { enabled: true },
  },
  {
    id: 'sk-manilla-001',
    slug: 'manilla-camino-andino',
    category: { slug: 'manillas', label: { es: 'Manillas', en: 'Bracelets' } },
    image: {
      url: '/images/manilla-geometrica.webp',
      width: 900,
      height: 900,
      alt: {
        es: 'Manilla circular tejida con mullos de varios colores',
        en: 'Circular bracelet woven with beads in several colors',
      },
    },
    origin: 'Saraguro, Loja, Ecuador',
    dimensions: 'Información pendiente de verificación',
    featured: true,
    published: true,
    rating: 4.9,
    reviewsCount: 22,
    priceEcuador: 15.00,
    priceUSA: 25.00,
    translations: {
      es: {
        name: 'Manilla Camino Andino',
        shortDescription: 'Manilla de mullos con una secuencia continua de color y geometría.',
        description: 'Diseño circular de tejido compacto pensado para mostrar el detalle del trabajo manual.',
        materials: 'Mullos de vidrio, hilo y cierre. Composición exacta pendiente de verificación.',
        technique: 'Tejido manual con mullos.',
        careInstructions: 'Evitar humedad prolongada y guardar sin doblar.',
        story: 'Una pieza de muestra para preparar el catálogo editorial de Sumak Kawsay.',
        seoTitle: 'Manilla Camino Andino | Sumak Kawsay',
        seoDescription: 'Manilla artesanal de mullos presentada por Sumak Kawsay, Saraguro, Loja.',
      },
      en: {
        name: 'Andean Path Bracelet',
        shortDescription: 'A beaded bracelet with a continuous sequence of color and geometry.',
        description: 'A compact circular weave designed to reveal the detail of the handwork.',
        materials: 'Glass beads, thread, and clasp. Exact composition awaiting verification.',
        technique: 'Handwoven beadwork.',
        careInstructions: 'Avoid prolonged moisture and store without folding.',
        story: 'A sample piece used to prepare the Sumak Kawsay editorial catalog.',
        seoTitle: 'Andean Path Bracelet | Sumak Kawsay',
        seoDescription: 'Handcrafted beadwork bracelet presented by Sumak Kawsay, Saraguro, Loja.',
      },
    },
    translationStatus: { es: 'approved', en: 'approved' },
    model3d: { enabled: false, autoRotate: true, scale: 1 },
    virtualTryOn: { enabled: false },
  },
  {
    id: 'sk-aretes-001',
    slug: 'aretes-luz-de-saraguro',
    category: { slug: 'aretes', label: { es: 'Aretes', en: 'Earrings' } },
    image: {
      url: '/images/aretes-mullos.webp',
      width: 900,
      height: 900,
      alt: {
        es: 'Par de aretes largos de mullos con rombos de colores',
        en: 'Pair of long beaded earrings with colorful diamond patterns',
      },
    },
    origin: 'Saraguro, Loja, Ecuador',
    dimensions: 'Información pendiente de verificación',
    featured: true,
    published: true,
    rating: 4.8,
    reviewsCount: 16,
    priceEcuador: 12.00,
    priceUSA: 18.00,
    translations: {
      es: {
        name: 'Aretes Luz de Saraguro',
        shortDescription: 'Aretes largos de mullos con movimiento y contraste de color.',
        description: 'Un par ligero visualmente, construido con líneas de mullos y un centro geométrico.',
        materials: 'Mullos de vidrio y herrajes para aretes. Material exacto pendiente de verificación.',
        technique: 'Tejido manual con mullos.',
        careInstructions: 'Guardar por separado y limpiar con un paño seco.',
        story: 'La ficha se completará con información verificada sobre autoría y proceso.',
        seoTitle: 'Aretes Luz de Saraguro | Sumak Kawsay',
        seoDescription: 'Aretes artesanales de mullos presentados por Sumak Kawsay, Saraguro, Loja.',
      },
      en: {
        name: 'Saraguro Light Earrings',
        shortDescription: 'Long beaded earrings with movement and contrasting color.',
        description: 'A visually light pair built from lines of beads and a geometric center.',
        materials: 'Glass beads and earring findings. Exact material awaiting verification.',
        technique: 'Handwoven beadwork.',
        careInstructions: 'Store separately and clean with a dry cloth.',
        story: 'This page will be completed with verified authorship and process information.',
        seoTitle: 'Saraguro Light Earrings | Sumak Kawsay',
        seoDescription: 'Handcrafted bead earrings presented by Sumak Kawsay, Saraguro, Loja.',
      },
    },
    translationStatus: { es: 'approved', en: 'approved' },
    model3d: { enabled: false, autoRotate: true, scale: 1 },
    virtualTryOn: { enabled: false },
  },
];

export const getPublishedProducts = (lang: Language) =>
  products.filter((product) => product.published && product.translationStatus[lang] === 'approved');

export const getProductBySlug = (slug: string, lang: Language) =>
  getPublishedProducts(lang).find((product) => product.slug === slug);
