import type { APIRoute } from 'astro';
import { getGalleryItems } from '../../lib/gallery';

export const prerender = true;

export const GET: APIRoute = async () => {
  const [es, en] = await Promise.all([getGalleryItems('es'), getGalleryItems('en')]);

  return new Response(JSON.stringify({ es, en }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
