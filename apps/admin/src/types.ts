export type TranslationStatus = 'pending' | 'machine-translated' | 'approved';
export type Category = string;

export interface CategoryTranslation {
  name: string;
  description: string;
}

export interface AdminCategory {
  id: string;
  slug: string;
  published: boolean;
  translations: { es: CategoryTranslation; en: CategoryTranslation };
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'admin' | 'editor';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductTranslation {
  name: string;
  shortDescription: string;
  description: string;
  materials: string;
  technique: string;
  careInstructions: string;
  seoTitle: string;
  seoDescription: string;
}

export interface AdminProduct {
  id: string;
  slug: string;
  category: Category;
  imageUrl: string;
  imagePublicId?: string;
  imageWidth?: number;
  imageHeight?: number;
  published: boolean;
  translations: { es: ProductTranslation; en: ProductTranslation };
  translationStatus: { es: TranslationStatus; en: TranslationStatus };
  model3d: {
    enabled: boolean;
    url: string;
    publicId: string;
    posterUrl: string;
    autoRotate: boolean;
    scale: number;
    rotationX: number;
    rotationY: number;
    rotationZ: number;
  };
  virtualTryOn: { enabled: boolean; overlayImageUrl?: string };
  priceEcuador?: number;
  priceUSA?: number;
  rating?: number;
  reviewsCount?: number;
  createdBy?: string;
  updatedAt: string;
}

export interface GalleryTranslation {
  title: string;
  description: string;
  tag: string;
  location: string;
}

export interface AdminGalleryItem {
  id: string;
  category: 'fairs' | 'craft' | 'artisans';
  imageUrl: string;
  year: string;
  published: boolean;
  translations: { es: GalleryTranslation; en: GalleryTranslation };
  createdAt?: string;
  updatedAt?: string;
}

