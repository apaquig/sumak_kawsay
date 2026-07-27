import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { GalleryItemModel } from '../models/GalleryItem.js';

const querySchema = z.object({ lang: z.enum(['es', 'en']).default('es') });

export async function galleryRoutes(app: FastifyInstance) {
  app.get('/v1/gallery', async (request, reply) => {
    const { lang } = querySchema.parse(request.query);
    const items = await GalleryItemModel.find({ published: true }).sort({ createdAt: -1 });

    reply.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return {
      lang,
      updatedAt: new Date().toISOString(),
      items: items.map((doc) => {
        const item = doc.toObject();
        const tr = item.translations[lang] || item.translations.es;
        return {
          id: item.id,
          category: item.category,
          title: tr.title,
          description: tr.description,
          tag: tr.tag,
          location: tr.location,
          year: item.year,
          image: item.imageUrl,
        };
      }),
    };
  });
}
