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

export const seedProducts: AdminProduct[] = [];
