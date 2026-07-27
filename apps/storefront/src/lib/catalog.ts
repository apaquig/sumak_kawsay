import type { Language } from './i18n';
import type { Product, ProductTranslation, TranslationStatus } from '../data/products';
import { products as fallbackProducts } from '../data/products';

const API_URL = import.meta.env.API_URL || process.env.API_URL || 'http://localhost:4000';
const TIMEOUT_MS = 5_000;

/** Etiquetas de categoría. Mapeo para traducciones por defecto, con fallback para categorías dinámicas. */
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

interface CatalogItem {
  id: string;
  slug: string;
  category: Product['category']['slug'];
  imageUrl: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  origin: string;
  dimensions: string;
  featured: boolean;
  virtualTryOn: { enabled: boolean; overlayImageUrl: string };
  priceEcuador?: number;
  priceUSA?: number;
  rating?: number;
  reviewsCount?: number;
  content: ProductTranslation;
  model3d: {
    enabled: boolean;
    url: string;
    posterUrl: string;
    autoRotate: boolean;
    scale: number;
  };
  updatedAt: string;
}

interface CatalogResponse {
  lang: Language;
  updatedAt: string;
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  products: CatalogItem[];
}

/**
 * La API solo devuelve el idioma pedido, así que rellenamos el otro con el
 * mismo contenido: las páginas siempre leen `translations[lang]` del idioma
 * que están renderizando.
 */
function toProduct(item: CatalogItem, categoryLabels: Map<string, Record<Language, string>>): Product {
  const approved: TranslationStatus = 'approved';

  return {
    id: item.id,
    slug: item.slug,
    category: { 
      slug: item.category, 
      label: categoryLabels.get(item.category) || getCategoryLabel(item.category) 
    },
    image: {
      url: item.imageUrl,
      width: item.imageWidth || 900,
      height: item.imageHeight || 900,
      alt: { es: item.imageAlt, en: item.imageAlt },
    },
    origin: item.origin,
    dimensions: item.dimensions,
    featured: item.featured,
    published: true,
    priceEcuador: item.priceEcuador ?? (item.category === 'collares' ? 35.00 : item.category === 'manillas' ? 15.00 : 12.00),
    priceUSA: item.priceUSA ?? (item.category === 'collares' ? 45.00 : item.category === 'manillas' ? 25.00 : 18.00),
    rating: item.rating ?? 5.0,
    translations: { es: item.content, en: item.content },
    // La API ya filtra por traducción aprobada, así que todo lo que llega lo está.
    translationStatus: { es: approved, en: approved },
    model3d: {
      enabled: Boolean(item.model3d?.enabled),
      url: item.model3d?.url || undefined,
      posterUrl: item.model3d?.posterUrl || undefined,
      autoRotate: item.model3d?.autoRotate ?? true,
      scale: item.model3d?.scale ?? 1,
    },
    // El probador solo existe en collares; la API ya aplica la misma regla.
    virtualTryOn: {
      enabled: item.category === 'collares' && Boolean(item.virtualTryOn?.enabled),
      overlayImageUrl: item.virtualTryOn?.overlayImageUrl || undefined,
    },
  };
}

export interface PaginatedProducts {
  products: Product[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

/** Caché por idioma dentro del proceso, para no golpear la API en cada visita. */
const cache = new Map<Language, { at: number; products: Product[] }>();
const paginatedCache = new Map<string, { at: number; result: PaginatedProducts }>();
const CACHE_MS = 60_000;

let warnedOffline = false;

export async function getPublishedProducts(lang: Language): Promise<Product[]> {
  const cached = cache.get(lang);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.products;

  try {
    const [prodResponse, catResponse] = await Promise.all([
      fetch(`${API_URL}/v1/catalog?lang=${lang}&limit=1000`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }),
      fetch(`${API_URL}/v1/catalog/categories`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }).catch(() => null)
    ]);

    if (!prodResponse.ok) throw new Error(`La API respondió ${prodResponse.status}`);

    const categoryLabels = new Map<string, Record<Language, string>>();
    if (catResponse && catResponse.ok) {
      const catData = await catResponse.json() as { categories: any[] };
      catData.categories.forEach((c) => {
        categoryLabels.set(c.slug, {
          es: c.translations?.es?.name || c.slug,
          en: c.translations?.en?.name || c.slug,
        });
      });
    }

    const data = (await prodResponse.json()) as CatalogResponse;
    const products = data.products.map(item => toProduct(item, categoryLabels));

    cache.set(lang, { at: Date.now(), products });
    warnedOffline = false;
    return products;
  } catch (error) {
    if (!warnedOffline) {
      console.warn('[catalogo] API no disponible, se usa el catálogo de respaldo:', error);
      warnedOffline = true;
    }
    return fallbackProducts.filter(
      (product) => product.published && product.translationStatus[lang] === 'approved',
    );
  }
}

export async function getPublishedProductsPaginated(
  lang: Language,
  page?: number,
  limit?: number,
  category?: string,
  ids?: string
): Promise<PaginatedProducts> {
  const cacheKey = `${lang}_${page || ''}_${limit || ''}_${category || ''}_${ids || ''}`;
  const cached = paginatedCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.result;

  try {
    let url = `${API_URL}/v1/catalog?lang=${lang}`;
    if (page !== undefined) url += `&page=${page}`;
    if (limit !== undefined) url += `&limit=${limit}`;
    if (category !== undefined) url += `&category=${category}`;
    if (ids !== undefined) url += `&ids=${ids}`;

    const [prodResponse, catResponse] = await Promise.all([
      fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }),
      fetch(`${API_URL}/v1/catalog/categories`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }).catch(() => null)
    ]);

    if (!prodResponse.ok) throw new Error(`La API respondió ${prodResponse.status}`);

    const categoryLabels = new Map<string, Record<Language, string>>();
    if (catResponse && catResponse.ok) {
      const catData = await catResponse.json() as { categories: any[] };
      catData.categories.forEach((c) => {
        categoryLabels.set(c.slug, {
          es: c.translations?.es?.name || c.slug,
          en: c.translations?.en?.name || c.slug,
        });
      });
    }

    const data = (await prodResponse.json()) as CatalogResponse;
    const products = data.products.map(item => toProduct(item, categoryLabels));
    
    const result: PaginatedProducts = {
      products,
      pagination: data.pagination || {
        totalItems: products.length,
        totalPages: 1,
        currentPage: 1,
        limit: products.length || 15
      }
    };

    paginatedCache.set(cacheKey, { at: Date.now(), result });
    return result;
  } catch (error) {
    const allFallback = fallbackProducts.filter(
      (product) => product.published && product.translationStatus[lang] === 'approved',
    );
    
    let filtered = allFallback;
    if (category === 'favorites' && ids) {
      const idArray = ids.split(',').filter(Boolean);
      filtered = allFallback.filter(p => idArray.includes(p.id));
    } else if (category && category !== 'all' && category !== 'favorites') {
      filtered = allFallback.filter(p => p.category.slug === category);
    }
      
    const totalItems = filtered.length;
    const finalLimit = limit || 15;
    const totalPages = Math.ceil(totalItems / finalLimit);
    const finalPage = page || 1;
    const skip = (finalPage - 1) * finalLimit;
    const products = filtered.slice(skip, skip + finalLimit);

    const result: PaginatedProducts = {
      products,
      pagination: {
        totalItems,
        totalPages,
        currentPage: finalPage,
        limit: finalLimit
      }
    };

    paginatedCache.set(cacheKey, { at: Date.now(), result });
    return result;
  }
}

export async function getProductBySlug(slug: string, lang: Language): Promise<Product | undefined> {
  const products = await getPublishedProducts(lang);
  return products.find((product) => product.slug === slug);
}

/** Todos los idiomas juntos, para sitemaps y catálogo público. */
export async function getAllPublishedProducts(): Promise<Product[]> {
  const [esRes, enRes] = await Promise.all([getPublishedProducts('es'), getPublishedProducts('en')]);
  const byId = new Map<string, Product>();
  [...esRes, ...enRes].forEach((product) => byId.set(product.id, product));
  return [...byId.values()];
}

interface PublicSettings {
  destinationEmail: string;
}

let cachedSettings: PublicSettings | null = null;

export async function getPublicSettings(): Promise<PublicSettings> {
  if (cachedSettings) return cachedSettings;
  try {
    const response = await fetch(`${API_URL}/v1/catalog/settings`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json() as PublicSettings;
    cachedSettings = data;
    return data;
  } catch (error) {
    return {
      destinationEmail: import.meta.env.CONTACT_DESTINATION_EMAIL || 'tammy.vcm@gmail.com',
    };
  }
}

export async function getCategories(lang: Language): Promise<[string, string][]> {
  try {
    const response = await fetch(`${API_URL}/v1/catalog/categories`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error();
    const data = await response.json() as { categories: any[] };
    return data.categories.map((c) => [
      c.slug,
      c.translations?.[lang]?.name || c.slug
    ]);
  } catch (e) {
    return [
      ['collares', lang === 'es' ? 'Collares' : 'Necklaces'],
      ['manillas', lang === 'es' ? 'Manillas' : 'Bracelets'],
      ['aretes', lang === 'es' ? 'Aretes' : 'Earrings'],
    ];
  }
}
