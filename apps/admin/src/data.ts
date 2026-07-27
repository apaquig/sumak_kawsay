import type { AdminProduct, ProductTranslation, AdminGalleryItem, GalleryTranslation } from './types';

const blankTranslation = (): ProductTranslation => ({
  name: '', shortDescription: '', description: '', materials: '', technique: '', careInstructions: '', seoTitle: '', seoDescription: '',
});

const blankGalleryTranslation = (): GalleryTranslation => ({
  title: '', description: '', tag: '', location: 'Saraguro, Loja · Ecuador 🇪🇨',
});

export const createEmptyGalleryItem = (): AdminGalleryItem => ({
  id: crypto.randomUUID(),
  category: 'fairs',
  imageUrl: '',
  year: '2026',
  published: true,
  translations: { es: blankGalleryTranslation(), en: blankGalleryTranslation() },
  updatedAt: new Date().toISOString(),
});


export const createEmptyProduct = (): AdminProduct => ({
  id: crypto.randomUUID(),
  slug: '',
  category: 'collares',
  imageUrl: '',
  featured: false,
  published: false,
  translations: { es: blankTranslation(), en: blankTranslation() },
  translationStatus: { es: 'approved', en: 'pending' },
  model3d: { enabled: false, url: '', publicId: '', posterUrl: '', autoRotate: true, scale: 1, rotationX: 0, rotationY: 0, rotationZ: 0 },
  virtualTryOn: { enabled: false },
  updatedAt: new Date().toISOString(),
});

export const seedProducts: AdminProduct[] = [
  {
    ...createEmptyProduct(),
    id: 'sk-collar-001',
    slug: 'collar-geometria-viva',
    category: 'collares',
    imageUrl: '/images/collar-saraguro.webp',
    published: true,
    translations: {
      es: { ...blankTranslation(), name: 'Collar Geometría Viva', shortDescription: 'Collar de mullos con patrones geométricos.', description: 'Pieza elaborada cuenta por cuenta.', materials: 'Mullos de vidrio e hilo.', technique: 'Tejido manual con mullos.', careInstructions: 'Guardar seco y separado.', seoTitle: 'Collar Geometría Viva | Sumak Kawsay', seoDescription: 'Collar artesanal de mullos presentado por Sumak Kawsay.' },
      en: { ...blankTranslation(), name: 'Living Geometry Necklace', shortDescription: 'Beaded necklace with geometric patterns.', description: 'A piece made bead by bead.', materials: 'Glass beads and thread.', technique: 'Handwoven beadwork.', careInstructions: 'Keep dry and store separately.', seoTitle: 'Living Geometry Necklace | Sumak Kawsay', seoDescription: 'Handcrafted beadwork necklace presented by Sumak Kawsay.' },
    },
    translationStatus: { es: 'approved', en: 'approved' },
    virtualTryOn: { enabled: true },
    featured: true,
    priceEcuador: 45,
    priceUSA: 60,
  },
  {
    ...createEmptyProduct(),
    id: 'sk-manilla-001',
    slug: 'manilla-camino-andino',
    category: 'manillas',
    imageUrl: '/images/manilla-geometrica.webp',
    published: true,
    translations: {
      es: { ...blankTranslation(), name: 'Manilla Camino Andino', shortDescription: 'Manilla de mullos multicolor.' },
      en: { ...blankTranslation(), name: 'Andean Path Bracelet', shortDescription: 'Multicolor beaded bracelet.' },
    },
    translationStatus: { es: 'approved', en: 'machine-translated' },
    featured: true,
    priceEcuador: 25,
    priceUSA: 35,
  },
];
