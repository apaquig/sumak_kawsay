import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ request, cookies, redirect }) => {
  const saved = cookies.get('sumak-language')?.value;
  const accepted = request.headers.get('accept-language')?.toLowerCase() ?? '';
  const language = saved === 'en' || saved === 'es' ? saved : accepted.startsWith('en') ? 'en' : 'es';
  return redirect(`/${language}/`, 302);
};
