import type { APIRoute } from 'astro';
import { getPublishedProducts } from '../lib/catalog';

export const prerender = false;

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ({ site }) => {
  const items = (await getPublishedProducts('es')).filter((product) => product.image.url);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${items.map((product) => `  <url>
    <loc>${new URL(`/es/producto/${product.slug}/`, site)}</loc>
    <image:image>
      <image:loc>${new URL(product.image.url, site)}</image:loc>
      <image:caption>${escapeXml(product.image.alt.es)}</image:caption>
    </image:image>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  });
};
