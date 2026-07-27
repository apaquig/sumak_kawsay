import type { APIRoute } from 'astro';
import { getGalleryItems } from '../../lib/gallery';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const lang = (url.searchParams.get('lang') === 'en' ? 'en' : 'es') as 'es' | 'en';
  const items = await getGalleryItems(lang);

  return new Response(JSON.stringify({ lang, items }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
};
