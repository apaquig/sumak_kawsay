import { Schema, model } from 'mongoose';

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

export interface ProductRecord {
  id: string;
  slug: string;
  category: string;
  imageUrl: string;
  imagePublicId: string;
  imageWidth: number;
  imageHeight: number;
  imageAlt: { es: string; en: string };
  origin: string;
  dimensions: string;
  featured: boolean;
  published: boolean;
  translations: { es: ProductTranslation; en: ProductTranslation };
  translationStatus: {
    es: 'pending' | 'machine-translated' | 'approved';
    en: 'pending' | 'machine-translated' | 'approved';
  };
  model3d: {
    url: string;
    publicId: string;
    posterUrl: string;
    enabled: boolean;
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
  createdAt?: Date;
  updatedAt?: Date;
}

const translationSchema = new Schema<ProductTranslation>({
  name: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  description: { type: String, default: '' },
  materials: { type: String, default: '' },
  technique: { type: String, default: '' },
  careInstructions: { type: String, default: '' },
  story: { type: String, default: '' },
  seoTitle: { type: String, default: '' },
  seoDescription: { type: String, default: '' },
}, { _id: false });

const productSchema = new Schema<ProductRecord>({
  id: { type: String, required: true, unique: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  category: { type: String, required: true, index: true },
  imageUrl: { type: String, default: '' },
  imagePublicId: { type: String, default: '' },
  imageWidth: { type: Number, default: 900 },
  imageHeight: { type: Number, default: 900 },
  imageAlt: {
    es: { type: String, default: '' },
    en: { type: String, default: '' },
  },
  origin: { type: String, default: 'Saraguro, Loja, Ecuador' },
  dimensions: { type: String, default: '' },
  priceEcuador: { type: Number, default: 0 },
  priceUSA: { type: Number, default: 0 },
  rating: { type: Number, default: 5.0 },
  reviewsCount: { type: Number, default: 0 },
  featured: { type: Boolean, default: false, index: true },
  published: { type: Boolean, default: false, index: true },
  translations: { es: translationSchema, en: translationSchema },
  translationStatus: {
    es: { type: String, enum: ['pending', 'machine-translated', 'approved'], default: 'approved' },
    en: { type: String, enum: ['pending', 'machine-translated', 'approved'], default: 'pending' },
  },
  model3d: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
    posterUrl: { type: String, default: '' },
    enabled: { type: Boolean, default: false },
    autoRotate: { type: Boolean, default: true },
    scale: { type: Number, default: 1, min: 0.05, max: 20 },
    rotationX: { type: Number, default: 0 },
    rotationY: { type: Number, default: 0 },
    rotationZ: { type: Number, default: 0 },
  },
  virtualTryOn: {
    enabled: { type: Boolean, default: false },
    overlayImageUrl: { type: String, default: '' },
  },
  createdBy: { type: String, default: '' },
}, {
  timestamps: true,
  toJSON: {
    versionKey: false,
    transform: (_doc, result) => {
      delete (result as { _id?: unknown })._id;
      return result;
    },
  },
});

productSchema.pre('save', function enforceCategoryRules() {
  if (this.category !== 'collares' && this.virtualTryOn) this.virtualTryOn.enabled = false;
  if (this.model3d && !this.model3d.url) this.model3d.enabled = false;
});

export const ProductModel = model<ProductRecord>('Product', productSchema);
