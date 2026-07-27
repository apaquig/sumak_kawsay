import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    `Sitemap: ${new URL('/sitemap-index.xml', site)}`,
    `Sitemap: ${new URL('/sitemap-products.xml', site)}`,
    `Sitemap: ${new URL('/sitemap-images.xml', site)}`,
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
