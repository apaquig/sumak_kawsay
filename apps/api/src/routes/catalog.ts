import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ProductModel } from '../models/Product.js';

const querySchema = z.object({
  lang: z.enum(['es', 'en']).default('es'),
  page: z.preprocess((val) => Number(val || 1), z.number().min(1)).default(1),
  limit: z.preprocess((val) => Number(val || 15), z.number().min(1)).default(15),
  category: z.string().optional(),
  ids: z.string().optional(),
});

export async function catalogRoutes(app: FastifyInstance) {
  app.get('/v1/catalog', async (request, reply) => {
    const { lang, page, limit, category, ids } = querySchema.parse(request.query);
    
    const query: any = {
      published: true,
      [`translationStatus.${lang}`]: 'approved',
    };
    
    if (category === 'favorites' && ids) {
      const idArray = ids.split(',').filter(Boolean);
      query.id = { $in: idArray };
    } else if (category && category !== 'all' && category !== 'favorites') {
      query.category = category;
    }

    const totalItems = await ProductModel.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    const products = await ProductModel.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    reply.header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return {
      lang,
      updatedAt: new Date().toISOString(),
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      },
      products: products.map((product) => {
        const data = product.toObject();
        return {
          id: data.id,
          slug: data.slug,
          category: data.category,
          imageUrl: data.imageUrl,
          imageAlt: data.imageAlt?.[lang],
          imageWidth: data.imageWidth,
          imageHeight: data.imageHeight,
          origin: data.origin,
          dimensions: data.dimensions,
          featured: data.featured,
          priceEcuador: data.priceEcuador,
          priceUSA: data.priceUSA,
          rating: data.rating,
          reviewsCount: data.reviewsCount,
          content: data.translations[lang],
          model3d: data.model3d,
          virtualTryOn: {
            enabled: data.category === 'collares' && Boolean(data.virtualTryOn?.enabled),
            overlayImageUrl: data.virtualTryOn?.overlayImageUrl || '',
          },
          updatedAt: data.updatedAt,
        };
      }),
    };
  });

  app.get('/v1/catalog/categories', async () => {
    const { CategoryModel } = await import('../models/Category.js');
    const categories = await CategoryModel.find({ published: true }).sort({ updatedAt: -1 });
    return { categories: categories.map((c) => c.toJSON()) };
  });

  app.get('/v1/catalog/settings', async () => {
    const { getSettings } = await import('../models/Settings.js');
    const settings = await getSettings();
    return {
      destinationEmail: settings.destinationEmail,
    };
  });
}
