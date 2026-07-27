import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ProductModel } from '../models/Product.js';
import { GalleryItemModel } from '../models/GalleryItem.js';

/**
 * Carga el catálogo de muestra y elementos de galería en MongoDB.
 * Es idempotente: no toca los registros que ya existen.
 */

interface SeedTranslation {
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

interface SeedProduct {
  id: string;
  slug: string;
  category: 'collares' | 'manillas' | 'aretes';
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  imageAlt: { es: string; en: string };
  origin: string;
  dimensions: string;
  featured: boolean;
  published: boolean;
  translations: { es: SeedTranslation; en: SeedTranslation };
  translationStatus: {
    es: 'pending' | 'machine-translated' | 'approved';
    en: 'pending' | 'machine-translated' | 'approved';
  };
  virtualTryOn: { enabled: boolean };
  price?: number;
}

interface SeedGalleryItem {
  id: string;
  category: 'fairs' | 'craft' | 'artisans';
  imageUrl: string;
  year: string;
  published: boolean;
  translations: {
    es: { title: string; location: string; tag: string; description: string };
    en: { title: string; location: string; tag: string; description: string };
  };
}

const SEED_GALLERY: SeedGalleryItem[] = [
  {
    id: 'gal-001',
    category: 'fairs',
    imageUrl: '/images/feria-saraguro.jpg',
    year: '2025 - 2026',
    published: true,
    translations: {
      es: {
        title: 'Feria Nacional de Artesanías de Saraguro',
        location: 'Saraguro, Loja · Ecuador 🇪🇨',
        tag: 'Feria Nacional',
        description: 'Exhibición oficial del stand artesanal de Sumak Kawsay con joyería de mullos de vidrio calibrados y demostración de tejido en vivo.',
      },
      en: {
        title: 'National Saraguro Artisan Fair',
        location: 'Saraguro, Loja · Ecuador 🇪🇨',
        tag: 'National Fair',
        description: 'Official exhibition booth featuring glass beadwork jewelry and live traditional weaving demonstrations.',
      },
    },
  },
  {
    id: 'gal-002',
    category: 'fairs',
    imageUrl: '/images/feria-quito.jpg',
    year: '2025',
    published: true,
    translations: {
      es: {
        title: 'Exposición de Arte Ancestral y Moda Andina',
        location: 'Quito · Ecuador 🇪🇨',
        tag: 'Exposición Quito',
        description: 'Presentación de collares Wallka y pulseras geométricas tradicionales ante diseñadores y visitantes en el centro histórico de Quito.',
      },
      en: {
        title: 'Ancestral Art & Andean Fashion Expo',
        location: 'Quito · Ecuador 🇪🇨',
        tag: 'Quito Expo',
        description: 'Showcasing Wallka necklaces and geometric bracelets to art lovers in historic Quito.',
      },
    },
  },
  {
    id: 'gal-003',
    category: 'fairs',
    imageUrl: '/images/feria-usa.jpg',
    year: '2026',
    published: true,
    translations: {
      es: {
        title: 'Encuentro Internacional de Joyería Artesanal',
        location: 'Nueva York · EE.UU. 🇺🇸',
        tag: 'Exposición USA',
        description: 'Muestra internacional de la artesanía Kichwa Saraguro para la comunidad ecuatoriana y coleccionistas en Estados Unidos.',
      },
      en: {
        title: 'International Artisan Jewelry Showcase',
        location: 'New York · USA 🇺🇸',
        tag: 'USA Exhibition',
        description: 'Bringing Saraguro heritage glass bead jewelry to collectors and the Ecuadorian community in the United States.',
      },
    },
  },
  {
    id: 'gal-004',
    category: 'artisans',
    imageUrl: '/images/hero-artesana-saraguro.png',
    year: 'Tradición Viva',
    published: true,
    translations: {
      es: {
        title: 'El Arte del Tejido Mullo a Mullo',
        location: 'Saraguro, Loja · Ecuador 🇪🇨',
        tag: 'Fundadora Yurak Macas',
        description: 'Yurak Macas tejiendo a mano con paciencia cada collar, pulsera y accesorio en su mesa de trabajo en Saraguro.',
      },
      en: {
        title: 'The Art of Bead-by-Beaded Hand Weaving',
        location: 'Saraguro, Loja · Ecuador 🇪🇨',
        tag: 'Founder Yurak Macas',
        description: 'Master artisan handweaving traditional Saraguro beadwork with high-strength thread.',
      },
    },
  },
  {
    id: 'gal-005',
    category: 'craft',
    imageUrl: '/images/hero-collar.webp',
    year: 'Colección 2026',
    published: true,
    translations: {
      es: {
        title: 'Collar Wallka de Alta Densidad',
        location: 'Saraguro, Loja · Ecuador 🇪🇨',
        tag: 'Joyería Fina',
        description: 'Detalle macro de la simetría y armonía de color en mullos de vidrio seleccionados pieza por pieza.',
      },
      en: {
        title: 'High-Density Wallka Necklace',
        location: 'Saraguro, Loja · Ecuador 🇪🇨',
        tag: 'Fine Jewelry',
        description: 'Macro view of symmetry and vibrant color harmonies in handpicked glass beads.',
      },
    },
  },
  {
    id: 'gal-006',
    category: 'craft',
    imageUrl: '/images/manilla-geometrica.webp',
    year: 'Colección 2026',
    published: true,
    translations: {
      es: {
        title: 'Manillas y Gargantillas Geométricas',
        location: 'Saraguro, Loja · Ecuador 🇪🇨',
        tag: 'Geometría Sagrada',
        description: 'Simbología ancestral andina representada en tramas de pulseras flexibles de gran durabilidad.',
      },
      en: {
        title: 'Geometric Bracelets & Necklaces',
        location: 'Saraguro, Loja · Ecuador 🇪🇨',
        tag: 'Sacred Geometry',
        description: 'Andean sacred symbols captured in durable handwoven beadwork.',
      },
    },
  },
];

const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: 'sk-collar-001',
    slug: 'collar-geometria-viva',
    category: 'collares',
    imageUrl: '/images/collar-saraguro.webp',
    imageWidth: 900,
    imageHeight: 900,
    imageAlt: {
      es: 'Collar ancho de mullos con motivos geométricos multicolores',
      en: 'Wide beaded necklace with multicolor geometric motifs',
    },
    origin: 'Saraguro, Loja, Ecuador',
    dimensions: 'Información pendiente de verificación',
    featured: true,
    published: true,
    translations: {
      es: {
        name: 'Collar Geometría Viva',
        shortDescription: 'Collar de mullos construido en patrones geométricos de color.',
        description:
          'Una pieza de presencia amplia, elaborada cuenta por cuenta y diseñada para destacar el ritmo de sus formas geométricas.',
        materials: 'Mullos de vidrio e hilo para bisutería. Información por confirmar en el inventario.',
        technique: 'Tejido manual con mullos. La técnica específica debe verificarse con la persona artesana.',
        careInstructions: 'Guardar seco y separado. Evitar perfumes, químicos y tirones.',
        story: 'Esta ficha demuestra cómo se documentará el origen y el proceso de cada pieza antes de publicarla.',
        seoTitle: 'Collar Geometría Viva | Sumak Kawsay',
        seoDescription:
          'Conoce el Collar Geometría Viva, una pieza artesanal de mullos presentada por Sumak Kawsay en Saraguro, Loja.',
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
        seoDescription:
          'Discover the Living Geometry Necklace, a handcrafted beadwork piece presented by Sumak Kawsay in Saraguro, Loja.',
      },
    },
    translationStatus: { es: 'approved', en: 'approved' },
    virtualTryOn: { enabled: true },
    price: 45,
  },
  {
    id: 'sk-manilla-001',
    slug: 'manilla-camino-andino',
    category: 'manillas',
    imageUrl: '/images/manilla-geometrica.webp',
    imageWidth: 900,
    imageHeight: 900,
    imageAlt: {
      es: 'Manilla tejida con mullos en franjas geométricas de colores',
      en: 'Beaded bracelet woven with geometric color bands',
    },
    origin: 'Saraguro, Loja, Ecuador',
    dimensions: 'Información pendiente de verificación',
    featured: true,
    published: true,
    translations: {
      es: {
        name: 'Manilla Camino Andino',
        shortDescription: 'Manilla de mullos con franjas de color inspiradas en el tejido local.',
        description: 'Una manilla ligera y resistente, tejida a mano con hileras de mullos de colores.',
        materials: 'Mullos de vidrio e hilo para bisutería. Información por confirmar en el inventario.',
        technique: 'Tejido manual con mullos. La técnica específica debe verificarse con la persona artesana.',
        careInstructions: 'Guardar seco y separado. Evitar perfumes, químicos y tirones.',
        story: 'Una pieza de muestra para preparar el catálogo verificado con las personas artesanas.',
        seoTitle: 'Manilla Camino Andino | Sumak Kawsay',
        seoDescription: 'Manilla artesanal de mullos elaborada a mano, presentada por Sumak Kawsay.',
      },
      en: {
        name: 'Andean Path Bracelet',
        shortDescription: 'A beaded bracelet with color bands inspired by local weaving.',
        description: 'A light, durable bracelet handwoven with rows of colorful glass beads.',
        materials: 'Glass beads and jewelry thread. Inventory details must be confirmed.',
        technique: 'Handwoven beadwork. The specific technique must be verified with the artisan.',
        careInstructions: 'Keep dry and store separately. Avoid perfume, chemicals, and pulling.',
        story: 'A sample piece used to prepare the verified catalog with the artisans.',
        seoTitle: 'Andean Path Bracelet | Sumak Kawsay',
        seoDescription: 'Handwoven beadwork bracelet presented by Sumak Kawsay.',
      },
    },
    translationStatus: { es: 'approved', en: 'approved' },
    virtualTryOn: { enabled: false },
    price: 25,
  },
  {
    id: 'sk-aretes-001',
    slug: 'aretes-luz-de-saraguro',
    category: 'aretes',
    imageUrl: '/images/aretes-mullos.webp',
    imageWidth: 900,
    imageHeight: 900,
    imageAlt: {
      es: 'Aretes de mullos en tonos cálidos con remate dorado',
      en: 'Beaded earrings in warm tones with golden accents',
    },
    origin: 'Saraguro, Loja, Ecuador',
    dimensions: 'Información pendiente de verificación',
    featured: true,
    published: true,
    translations: {
      es: {
        name: 'Aretes Luz de Saraguro',
        shortDescription: 'Aretes de mullos en tonos cálidos, ligeros y llamativos.',
        description: 'Aretes tejidos a mano, pensados para acompañar tanto atuendos festivos como cotidianos.',
        materials: 'Mullos de vidrio e hilo para bisutería. Información por confirmar en el inventario.',
        technique: 'Tejido manual con mullos. La técnica específica debe verificarse con la persona artesana.',
        careInstructions: 'Guardar seco y separado. Evitar perfumes, químicos y tirones.',
        story: 'La ficha se completará con información verificada de la persona artesana antes de la venta.',
        seoTitle: 'Aretes Luz de Saraguro | Sumak Kawsay',
        seoDescription: 'Aretes artesanales de mullos en tonos cálidos, presentados por Sumak Kawsay.',
      },
      en: {
        name: 'Saraguro Light Earrings',
        shortDescription: 'Beaded earrings in warm tones, light and striking.',
        description: 'Handwoven earrings designed for festive and everyday wear alike.',
        materials: 'Glass beads and jewelry thread. Inventory details must be confirmed.',
        technique: 'Handwoven beadwork. The specific technique must be verified with the artisan.',
        careInstructions: 'Keep dry and store separately. Avoid perfume, chemicals, and pulling.',
        story: 'This page will be completed with verified artisan information before sale.',
        seoTitle: 'Saraguro Light Earrings | Sumak Kawsay',
        seoDescription: 'Handcrafted beadwork earrings in warm tones, presented by Sumak Kawsay.',
      },
    },
    translationStatus: { es: 'approved', en: 'approved' },
    virtualTryOn: { enabled: false },
    price: 18,
  },
];

async function seed() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5_000 });
  console.log('[seed] MongoDB conectado');

  let creados = 0;
  let omitidos = 0;

  for (const product of SEED_PRODUCTS) {
    const existing = await ProductModel.findOne({ id: product.id });
    if (existing) {
      omitidos += 1;
      continue;
    }

    await ProductModel.create({
      ...product,
      imagePublicId: '',
      model3d: {
        url: '',
        publicId: '',
        posterUrl: '',
        enabled: false,
        autoRotate: true,
        scale: 1,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
      },
    });
    creados += 1;
    console.log(`[seed] creado ${product.id} (${product.slug})`);
  }

  for (const item of SEED_GALLERY) {
    const existing = await GalleryItemModel.findOne({ id: item.id });
    if (!existing) {
      await GalleryItemModel.create(item);
      console.log(`[seed] creada galería ${item.id}`);
    }
  }

  console.log(`[seed] listo: ${creados} productos creados, ${omitidos} ya existían`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('[seed] falló:', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
