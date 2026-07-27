import type { APIRoute } from 'astro';
import { getPublishedProducts } from '../lib/catalog';

// Se arma en cada petición: refleja lo que hay publicado ahora mismo.
export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const [es, en] = await Promise.all([getPublishedProducts('es'), getPublishedProducts('en')]);

  const urls = [
    ...es.map((product) => `/es/producto/${product.slug}/`),
    ...en.map((product) => `/en/product/${product.slug}/`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${new URL(path, site)}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  });
};
