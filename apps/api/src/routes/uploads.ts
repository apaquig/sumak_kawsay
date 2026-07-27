import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createUploadSignature } from '../services/cloudinary.js';

const bodySchema = z.object({ resourceType: z.enum(['image', 'raw']) });

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/v1/admin/uploads/signature', async (request, reply) => {
    const { resourceType } = bodySchema.parse(request.body);
    try {
      return createUploadSignature(resourceType);
    } catch (error) {
      request.log.error(error);
      return reply.code(503).send({ error: 'Cloudinary is not configured' });
    }
  });
}
