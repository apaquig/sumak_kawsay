import mongoose from 'mongoose';
import type { Language } from './i18n';
import type { Product, ProductTranslation, TranslationStatus } from '../data/products';
import type { GalleryItem } from './gallery';

const DEFAULT_MONGODB_URI = 'mongodb+srv://tammyvcm_db_user:TammyDB2026Seguro@cluster0.szhmuot.mongodb.net/sumak_kawsay';

let isConnected = false;

async function getDbConnection() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection.db;
  }
  const uri = process.env.MONGODB_URI || (import.meta as any).env?.MONGODB_URI || DEFAULT_MONGODB_URI;
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 10000,
  });
  isConnected = true;
  return mongoose.connection.db;
}

function getCategoryLabel(slug: string): Record<Language, string> {
  const labels: Record<string, Record<Language, string>> = {
    collares: { es: 'Collares', en: 'Necklaces' },
    manillas: { es: 'Manillas', en: 'Bracelets' },
    aretes: { es: 'Aretes', en: 'Earrings' },
  };
  if (labels[slug]) return labels[slug];
  const capitalized = slug.charAt(0).toUpperCase() + slug.slice(1);
  return { es: capitalized, en: capitalized };
}

export async function getAtlasProducts(_lang: Language): Promise<Product[]> {
  const db = await getDbConnection();
  if (!db) throw new Error('No se pudo conectar a la base de datos');

  const [rawProducts, rawCategories] = await Promise.all([
    db.collection('products').find({ published: true }).sort({ updatedAt: -1 }).toArray(),
    db.collection('categories').find({ published: true }).toArray().catch(() => []),
  ]);

  const categoryLabels = new Map<string, Record<Language, string>>();
  rawCategories.forEach((c: any) => {
    categoryLabels.set(c.slug, {
      es: c.translations?.es?.name || c.slug,
      en: c.translations?.en?.name || c.slug,
    });
  });

  return rawProducts.map((p: any): Product => {
    const esContent: ProductTranslation = {
      name: p.translations?.es?.name || p.slug,
      shortDescription: p.translations?.es?.shortDescription || '',
      description: p.translations?.es?.description || '',
      materials: p.translations?.es?.materials || '',
      technique: p.translations?.es?.technique || '',
      careInstructions: p.translations?.es?.careInstructions || '',
      story: p.translations?.es?.story || '',
      seoTitle: p.translations?.es?.seoTitle || p.translations?.es?.name || '',
      seoDescription: p.translations?.es?.seoDescription || p.translations?.es?.shortDescription || '',
    };

    const enContent: ProductTranslation = {
      name: p.translations?.en?.name || esContent.name,
      shortDescription: p.translations?.en?.shortDescription || esContent.shortDescription,
      description: p.translations?.en?.description || esContent.description,
      materials: p.translations?.en?.materials || esContent.materials,
      technique: p.translations?.en?.technique || esContent.technique,
      careInstructions: p.translations?.en?.careInstructions || esContent.careInstructions,
      story: p.translations?.en?.story || esContent.story,
      seoTitle: p.translations?.en?.seoTitle || esContent.seoTitle,
      seoDescription: p.translations?.en?.seoDescription || esContent.seoDescription,
    };

    const approved: TranslationStatus = 'approved';

    return {
      id: p.id || String(p._id),
      slug: p.slug,
      category: {
        slug: p.category,
        label: categoryLabels.get(p.category) || getCategoryLabel(p.category),
      },
      image: {
        url: p.imageUrl || '/images/collar-saraguro.webp',
        width: p.imageWidth || 900,
        height: p.imageHeight || 900,
        alt: {
          es: p.imageAlt?.es || esContent.name,
          en: p.imageAlt?.en || enContent.name,
        },
      },
      origin: p.origin || 'Saraguro, Loja, Ecuador',
      dimensions: p.dimensions || '',
      featured: Boolean(p.featured),
      published: true,
      priceEcuador: p.priceEcuador ?? 25.00,
      priceUSA: p.priceUSA ?? 35.00,
      rating: p.rating ?? 5.0,
      reviewsCount: p.reviewsCount ?? 0,
      translations: {
        es: esContent,
        en: enContent,
      },
      translationStatus: {
        es: approved,
        en: approved,
      },
      model3d: {
        enabled: Boolean(p.model3d?.enabled),
        url: p.model3d?.url || undefined,
        posterUrl: p.model3d?.posterUrl || undefined,
        autoRotate: p.model3d?.autoRotate ?? true,
        scale: p.model3d?.scale ?? 1,
      },
      virtualTryOn: {
        enabled: p.category === 'collares' && Boolean(p.virtualTryOn?.enabled),
        overlayImageUrl: p.virtualTryOn?.overlayImageUrl || undefined,
      },
    };
  });
}

export async function getAtlasCategories(lang: Language): Promise<[string, string][]> {
  const db = await getDbConnection();
  if (!db) throw new Error('No DB connection');
  const categories = await db.collection('categories').find({ published: true }).toArray();
  if (!categories || categories.length === 0) {
    return [
      ['collares', lang === 'es' ? 'Collares' : 'Necklaces'],
      ['manillas', lang === 'es' ? 'Manillas' : 'Bracelets'],
      ['aretes', lang === 'es' ? 'Aretes' : 'Earrings'],
    ];
  }
  return categories.map((c: any) => [
    c.slug,
    c.translations?.[lang]?.name || c.slug,
  ]);
}

export async function getAtlasGalleryItems(lang: Language): Promise<GalleryItem[]> {
  const db = await getDbConnection();
  if (!db) throw new Error('No DB connection');
  const items = await db.collection('galleryitems').find({ published: true }).sort({ updatedAt: -1 }).toArray();
  if (!items || items.length === 0) return [];

  return items.map((g: any): GalleryItem => ({
    id: g.id || String(g._id),
    category: g.category,
    title: g.translations?.[lang]?.title || g.translations?.es?.title || '',
    description: g.translations?.[lang]?.description || g.translations?.es?.description || '',
    tag: g.translations?.[lang]?.tag || g.translations?.es?.tag || '',
    location: g.translations?.[lang]?.location || g.translations?.es?.location || 'Saraguro, Loja · Ecuador 🇪🇨',
    year: g.year || '2026',
    image: g.imageUrl,
  }));
}

export async function getAtlasSettings(): Promise<{ destinationEmail: string }> {
  const db = await getDbConnection();
  if (!db) throw new Error('No DB connection');
  const settings = await db.collection('settings').findOne({});
  return {
    destinationEmail: settings?.destinationEmail || 'tammy.vcm@gmail.com',
  };
}
