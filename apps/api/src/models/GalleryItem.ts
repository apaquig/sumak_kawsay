import { Schema, model } from 'mongoose';

export interface GalleryTranslation {
  title: string;
  description: string;
  tag: string;
  location: string;
}

export interface GalleryItemRecord {
  id: string;
  category: 'fairs' | 'craft' | 'artisans';
  imageUrl: string;
  year: string;
  published: boolean;
  translations: { es: GalleryTranslation; en: GalleryTranslation };
  createdAt?: Date;
  updatedAt?: Date;
}

const translationSchema = new Schema<GalleryTranslation>(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    tag: { type: String, default: '' },
    location: { type: String, default: 'Saraguro, Loja · Ecuador 🇪🇨' },
  },
  { _id: false },
);

const galleryItemSchema = new Schema<GalleryItemRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    category: {
      type: String,
      enum: ['fairs', 'craft', 'artisans'],
      required: true,
      index: true,
    },
    imageUrl: { type: String, required: true },
    year: { type: String, default: '2026' },
    published: { type: Boolean, default: true, index: true },
    translations: { es: translationSchema, en: translationSchema },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_doc, result) => {
        delete (result as { _id?: unknown })._id;
        return result;
      },
    },
  },
);

export const GalleryItemModel = model<GalleryItemRecord>('GalleryItem', galleryItemSchema);
