import { Schema, model } from 'mongoose';

export interface CategoryTranslation {
  name: string;
  description: string;
}

export interface CategoryRecord {
  id: string;
  slug: string;
  published: boolean;
  translations: { es: CategoryTranslation; en: CategoryTranslation };
  createdAt?: Date;
  updatedAt?: Date;
}

const translationSchema = new Schema<CategoryTranslation>({
  name: { type: String, default: '' },
  description: { type: String, default: '' },
}, { _id: false });

const categorySchema = new Schema<CategoryRecord>({
  id: { type: String, required: true, unique: true, index: true },
  slug: { type: String, required: true, unique: true, index: true },
  published: { type: Boolean, default: true, index: true },
  translations: { es: translationSchema, en: translationSchema },
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

export const CategoryModel = model<CategoryRecord>('Category', categorySchema);
