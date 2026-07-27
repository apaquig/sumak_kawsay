import type { APIRoute } from 'astro';
import { getPublishedProducts } from '../../lib/catalog';

// Catálogo público de solo lectura, servido desde Mongo.
export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const [es, en] = await Promise.all([getPublishedProducts('es'), getPublishedProducts('en')]);

  // Solo entra el idioma cuya traducción está aprobada; la API ya filtra por eso.
  const byId = new Map<string, { es?: typeof es[number]; en?: typeof en[number] }>();
  es.forEach((product) => byId.set(product.id, { ...byId.get(product.id), es: product }));
  en.forEach((product) => byId.set(product.id, { ...byId.get(product.id), en: product }));

  const products = [...byId.values()].map((entry) => {
    const base = entry.es ?? entry.en!;
    const translations: Record<string, unknown> = {};

    (['es', 'en'] as const).forEach((lang) => {
      const product = entry[lang];
      if (!product) return;
      const content = product.translations[lang];
      translations[lang] = {
        name: content.name,
        shortDescription: content.shortDescription,
        materials: content.materials,
        technique: content.technique,
      };
    });

    return {
      id: base.id,
      slug: base.slug,
      category: base.category.slug,
      origin: base.origin,
      dimensions: base.dimensions,
      image: base.image.url ? new URL(base.image.url, site) : null,
      translations,
    };
  });

  return new Response(
    JSON.stringify({ updatedAt: new Date().toISOString(), count: products.length, products }, null, 2),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=600',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
};
