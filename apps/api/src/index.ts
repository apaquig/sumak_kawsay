import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { adminRoutes } from './routes/admin.js';
import { catalogRoutes } from './routes/catalog.js';
import { contactRoutes } from './routes/contact.js';
import { galleryRoutes } from './routes/gallery.js';
import { uploadRoutes } from './routes/uploads.js';

const app = Fastify({ logger: true, bodyLimit: 2 * 1024 * 1024 });

await app.register(helmet);
// En desarrollo el navegador puede entrar por localhost o por 127.0.0.1:
// se aceptan las dos formas de cada origen configurado.
const allowedOrigins = [
  ...new Set(
    [env.ADMIN_ORIGIN, env.STOREFRONT_ORIGIN].flatMap((origin) => [
      origin,
      origin.replace('localhost', '127.0.0.1'),
      origin.replace('127.0.0.1', 'localhost'),
    ]),
  ),
];

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) {
      cb(null, true);
      return;
    }
    try {
      const url = new URL(origin);
      const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
      if (isLocal || allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
    } catch {
      // Ignorar URLs malformadas
    }
    cb(new Error('Not allowed by CORS'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-key', 'Authorization'],
});
await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

app.addHook('onRequest', async (request, reply) => {
  if (!request.url.startsWith('/v1/admin') || request.url.startsWith('/v1/admin/login') || request.url.startsWith('/v1/admin/forgot-password') || request.url.startsWith('/v1/admin/reset-password')) return;
  
  const authHeader = request.headers['authorization'];
  const legacyKey = request.headers['x-admin-key'];

  if (legacyKey === env.ADMIN_API_KEY && env.ADMIN_API_KEY) {
    return;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    try {
      jwt.verify(token, env.JWT_SECRET);
      return;
    } catch {
      return reply.code(401).send({ error: 'Token inválido o expirado' });
    }
  }

  return reply.code(401).send({ error: 'Unauthorized' });
});

app.get('/health', async (_request, reply) => {
  const connected = mongoose.connection.readyState === 1;
  return reply.code(connected ? 200 : 503).send({
    status: connected ? 'ok' : 'degraded',
    database: connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Must be registered before the route plugins below: Fastify resolves each plugin's error
// handler from what's visible on the parent instance at the moment that plugin is registered,
// so setting this afterward left admin/catalog/etc. routes falling through to Fastify's
// default handler — every Zod validation failure came back as an opaque 500 instead of a 400
// with `issues`, which the admin panel's client then misreported as "the API didn't respond".
app.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.code(400).send({ error: 'Invalid request', issues: error.issues });
  }
  request.log.error(error);
  return reply.code(500).send({ error: 'Unexpected server error' });
});

await app.register(catalogRoutes);
await app.register(galleryRoutes);
await app.register(contactRoutes);
await app.register(adminRoutes);
await app.register(uploadRoutes);

mongoose.set('bufferCommands', false);
try {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5_000 });
  app.log.info('MongoDB connected');
} catch (error) {
  app.log.warn({ error }, 'MongoDB unavailable; API will report degraded health');
}

await app.listen({ host: '0.0.0.0', port: env.PORT });

const shutdown = async () => {
  await app.close();
  await mongoose.disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
