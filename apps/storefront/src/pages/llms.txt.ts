import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const body = `# Sumak Kawsay

Sumak Kawsay presenta artesanías de mullos elaboradas en Saraguro, Loja, Ecuador.

## Fuentes públicas
- Sitio en español: ${new URL('/es/', site)}
- English website: ${new URL('/en/', site)}
- Catálogo JSON: ${new URL('/api/catalog.json', site)}
- Historia y proceso: ${new URL('/es/nuestra-historia/', site)}

Los datos de materiales, técnicas, autoría y origen se publican únicamente cuando han sido verificados. Las traducciones automáticas se revisan antes de indexarse.
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
