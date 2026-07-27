import type { FastifyInstance, FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { env } from '../config/env.js';
import { ProductModel } from '../models/Product.js';
import { UserModel, hashPassword, comparePassword } from '../models/User.js';
import { LibreTranslateProvider } from '../services/translation/LibreTranslateProvider.js';

/* ── JWT helpers ──────────────────────────────────────────────── */

interface JwtPayload { userId: string; email: string; role: string }

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

/* ── Migrate legacy admin from Settings → Users on first boot ─ */

async function ensureAdminUser() {
  const existing = await UserModel.findOne({ role: 'admin' });
  if (existing) return;

  const { getSettings } = await import('../models/Settings.js');
  const settings = await getSettings();
  const email = settings.adminEmail || settings.destinationEmail || 'admin@sumakkawsay.com';
  const password = settings.adminPassword || env.ADMIN_PASSWORD || 'sumakadmin2026';

  await UserModel.create({
    id: randomUUID(),
    name: settings.adminUsername || 'Administrador',
    email,
    passwordHash: await hashPassword(password),
    photoUrl: '',
    role: 'admin',
  });
  console.log(`✅ Admin user migrated: ${email}`);
}

/* ── Zod schemas ──────────────────────────────────────────────── */

const translationSchema = z.object({
  name: z.string().max(160),
  shortDescription: z.string().max(400).optional().default(''),
  description: z.string().max(8_000),
  materials: z.string().max(2_000),
  technique: z.string().max(2_000).optional().default(''),
  careInstructions: z.string().max(2_000),
  story: z.string().max(8_000).optional(),
  seoTitle: z.string().max(160),
  seoDescription: z.string().max(320),
});

const statusSchema = z.enum(['pending', 'machine-translated', 'approved']);

const productInputSchema = z.object({
  id: z.string().min(3).max(120),
  slug: z.string().min(3).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.string(),
  imageUrl: z.string().max(2_000).default(''),
  imagePublicId: z.string().max(500).optional().default(''),
  imageWidth: z.number().int().min(1).max(10_000).optional(),
  imageHeight: z.number().int().min(1).max(10_000).optional(),
  imageAlt: z.object({ es: z.string().max(300), en: z.string().max(300) }).optional(),
  origin: z.string().max(300).optional(),
  dimensions: z.string().max(300).optional(),
  featured: z.boolean().optional(),
  published: z.boolean(),
  translations: z.object({ es: translationSchema, en: translationSchema }),
  translationStatus: z.object({ es: statusSchema, en: statusSchema }),
  model3d: z.object({
    url: z.string().max(2_000),
    publicId: z.string().max(500),
    posterUrl: z.string().max(2_000),
    enabled: z.boolean(),
    autoRotate: z.boolean(),
    scale: z.number().min(0.05).max(20),
    rotationX: z.number().min(-6.3).max(6.3),
    rotationY: z.number().min(-6.3).max(6.3),
    rotationZ: z.number().min(-6.3).max(6.3),
  }),
  virtualTryOn: z.object({ enabled: z.boolean(), overlayImageUrl: z.string().optional() }),
  priceEcuador: z.number().optional(),
  priceUSA: z.number().optional(),
  rating: z.number().optional(),
  reviewsCount: z.number().optional(),
  updatedAt: z.string().optional(),
});

/* ── Route plugin ─────────────────────────────────────────────── */

export async function adminRoutes(app: FastifyInstance) {
  const translator = new LibreTranslateProvider(env.LIBRETRANSLATE_URL, env.LIBRETRANSLATE_API_KEY);

  // Ensure admin user exists on startup
  ensureAdminUser().catch(err => console.error('Error migrating admin:', err));

  /* ── Auth helper: extract user from JWT ─────────────────────── */

  async function requireAuth(request: FastifyRequest): Promise<JwtPayload> {
    const header = request.headers['authorization'] || request.headers['x-admin-key'];
    if (!header) throw { statusCode: 401, message: 'No autorizado' };

    const token = typeof header === 'string' ? header.replace('Bearer ', '') : '';

    // Support legacy x-admin-key (matches env.ADMIN_API_KEY)
    if (env.ADMIN_API_KEY && token === env.ADMIN_API_KEY) {
      const admin = await UserModel.findOne({ role: 'admin' });
      if (admin) return { userId: admin.id, email: admin.email, role: admin.role };
      throw { statusCode: 401, message: 'No autorizado' };
    }

    try {
      return verifyToken(token);
    } catch {
      throw { statusCode: 401, message: 'Token inválido o expirado' };
    }
  }

  function requireRole(payload: JwtPayload, role: string) {
    if (payload.role !== role) {
      throw { statusCode: 403, message: 'No tienes permisos para esta acción' };
    }
  }

  /* ── Login ──────────────────────────────────────────────────── */

  app.post('/v1/admin/login', async (request, reply) => {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string(),
    }).parse(request.body);

    const user = await UserModel.findOne({ email });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return reply.code(401).send({ error: 'Correo o contraseña incorrectos' });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const userJson = user.toJSON();
    return { token, user: userJson };
  });

  /* ── Forgot / Reset password ────────────────────────────────── */

  app.post('/v1/admin/forgot-password', async (request, reply) => {
    const { email } = z.object({ email: z.string().email() }).parse(request.body);
    const user = await UserModel.findOne({ email });
    if (!user) return { success: true }; // don't leak

    const token = randomUUID();
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      const origin = (request.headers.origin || request.headers.referer || env.ADMIN_ORIGIN) as string;
      const baseOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      // If referer is a full URL, strip paths to get just origin (e.g. http://host/forgot -> http://host)
      let cleanOrigin = baseOrigin;
      try {
        const parsedUrl = new URL(baseOrigin);
        cleanOrigin = parsedUrl.origin;
      } catch {
        // Fallback to baseOrigin
      }
      const resetLink = `${cleanOrigin}/?token=${token}`;
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      });
      try {
        await transporter.sendMail({
          from: `"Sumak Kawsay" <${env.SMTP_FROM_EMAIL}>`,
          to: email,
          subject: 'Recuperación de contraseña - Panel Administrativo',
          html: `<p>Has solicitado restablecer tu contraseña.</p>
                 <p>Haz clic en el siguiente enlace (válido por 1 hora):</p>
                 <a href="${resetLink}">Restablecer Contraseña</a>`
        });
      } catch (err) {
        console.error('Error sending SMTP email:', err);
        return reply.code(500).send({ error: 'Error del servidor de correos.' });
      }
    }
    return { success: true };
  });

  app.post('/v1/admin/reset-password', async (request, reply) => {
    const { token, newPassword } = z.object({
      token: z.string().min(10),
      newPassword: z.string().min(6)
    }).parse(request.body);

    const user = await UserModel.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });
    if (!user) return reply.code(400).send({ error: 'Token inválido o expirado' });

    user.passwordHash = await hashPassword(newPassword);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return { success: true };
  });

  /* ── Me (current user) ──────────────────────────────────────── */

  app.get('/v1/admin/me', async (request) => {
    const auth = await requireAuth(request);
    const user = await UserModel.findOne({ id: auth.userId });
    if (!user) throw { statusCode: 404, message: 'Usuario no encontrado' };
    return user.toJSON();
  });

  app.put('/v1/admin/me', async (request) => {
    const auth = await requireAuth(request);
    const body = z.object({
      name: z.string().min(1).max(100).optional(),
      email: z.string().email().optional(),
      password: z.string().min(6).optional(),
      photoUrl: z.string().max(2000).optional(),
    }).parse(request.body);

    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = body.name;
    if (body.email) updates.email = body.email;
    if (body.photoUrl !== undefined) updates.photoUrl = body.photoUrl;
    if (body.password) updates.passwordHash = await hashPassword(body.password);

    const user = await UserModel.findOneAndUpdate(
      { id: auth.userId },
      { $set: updates },
      { new: true }
    );
    return user?.toJSON();
  });

  /* ── User Management (admin only) ──────────────────────────── */

  app.get('/v1/admin/users', async (request) => {
    const auth = await requireAuth(request);
    requireRole(auth, 'admin');
    const users = await UserModel.find().sort({ createdAt: -1 });
    return { users: users.map(u => u.toJSON()) };
  });

  app.put('/v1/admin/users/:id', async (request) => {
    const auth = await requireAuth(request);
    requireRole(auth, 'admin');
    const { id } = request.params as { id: string };
    const body = z.object({
      id: z.string(),
      name: z.string().min(1).max(100),
      email: z.string().email(),
      password: z.string().min(6).optional(),
      photoUrl: z.string().max(2000).optional(),
      role: z.enum(['admin', 'editor']),
    }).parse(request.body);

    const updates: Record<string, unknown> = {
      id: body.id,
      name: body.name,
      email: body.email,
      role: body.role,
    };
    if (body.photoUrl !== undefined) updates.photoUrl = body.photoUrl;
    if (body.password) updates.passwordHash = await hashPassword(body.password);

    const saved = await UserModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return saved.toJSON();
  });

  app.delete('/v1/admin/users/:id', async (request, reply) => {
    const auth = await requireAuth(request);
    requireRole(auth, 'admin');
    const { id } = request.params as { id: string };

    // Don't allow deleting yourself
    if (auth.userId === id) {
      return reply.code(400).send({ error: 'No puedes eliminarte a ti mismo' });
    }

    await UserModel.deleteOne({ id });
    return { success: true };
  });

  /* ── Settings ───────────────────────────────────────────────── */

  app.get('/v1/admin/settings', async (request) => {
    await requireAuth(request);
    const { getSettings } = await import('../models/Settings.js');
    const settings = await getSettings();
    return {
      adminEmail: settings.adminEmail,
      adminUsername: settings.adminUsername,
      adminPassword: settings.adminPassword,
      destinationEmail: settings.destinationEmail,
    };
  });

  app.put('/v1/admin/settings', async (request) => {
    await requireAuth(request);
    const settingsSchema = z.object({
      adminEmail: z.string().email(),
      adminUsername: z.string().min(1),
      adminPassword: z.string().min(1),
      destinationEmail: z.string().email(),
    });
    const parsed = settingsSchema.parse(request.body);

    const { Settings } = await import('../models/Settings.js');
    const updated = await Settings.findOneAndUpdate(
      {},
      { $set: parsed },
      { new: true, upsert: true }
    );

    // Sync admin user
    const admin = await UserModel.findOne({ role: 'admin' });
    if (admin) {
      admin.email = parsed.adminEmail;
      admin.name = parsed.adminUsername;
      admin.passwordHash = await hashPassword(parsed.adminPassword);
      await admin.save();
    }

    return updated.toJSON();
  });

  /* ── Products ───────────────────────────────────────────────── */

  app.get('/v1/admin/products', async (request) => {
    await requireAuth(request);
    const products = await ProductModel.find().sort({ updatedAt: -1 });
    return { products: products.map((product) => product.toJSON()) };
  });

  app.put('/v1/admin/products/:id', async (request, reply) => {
    const auth = await requireAuth(request);
    const { id } = request.params as { id: string };
    const parsed = productInputSchema.parse(request.body);
    if (parsed.id !== id) return reply.code(400).send({ error: 'Product id does not match route' });

    const { translations, updatedAt: _ignored, ...rest } = parsed;

    const user = await UserModel.findOne({ id: auth.userId });
    const createdByName = user?.name || auth.email;

    // Check if product already exists (don't overwrite createdBy on updates)
    const existingProduct = await ProductModel.findOne({ id });

    const updates: Record<string, unknown> = {
      ...rest,
      virtualTryOn: {
        enabled: parsed.virtualTryOn.enabled,
        overlayImageUrl: parsed.virtualTryOn.overlayImageUrl || '',
      },
      model3d: { ...parsed.model3d, enabled: Boolean(parsed.model3d.enabled && parsed.model3d.url) },
    };

    // Only set createdBy on new products
    if (!existingProduct) {
      updates.createdBy = createdByName;
    }

    for (const lang of ['es', 'en'] as const) {
      for (const [field, value] of Object.entries(translations[lang])) {
        if (value !== undefined) updates[`translations.${lang}.${field}`] = value;
      }
    }

    const saved = await ProductModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    if (!saved) return reply.code(500).send({ error: 'Product could not be saved' });
    return saved.toJSON();
  });

  app.post('/v1/admin/products/:id/translate/en', async (request, reply) => {
    await requireAuth(request);
    const { id } = request.params as { id: string };
    const product = await ProductModel.findOne({ id });
    if (!product) return reply.code(404).send({ error: 'Product not found' });

    const source = translationSchema.parse(product.translations.es);
    const translated = await translator.translateProduct(source);
    product.set('translations.en', translated);
    product.set('translationStatus.en', 'machine-translated');
    await product.save();
    return product.toJSON();
  });

  /* ── Categories (admin only) ────────────────────────────────── */

  app.get('/v1/admin/categories', async (request) => {
    await requireAuth(request);
    const { CategoryModel } = await import('../models/Category.js');
    const items = await CategoryModel.find().sort({ updatedAt: -1 });
    return { items: items.map((i) => i.toJSON()) };
  });

  app.put('/v1/admin/categories/:id', async (request) => {
    const auth = await requireAuth(request);
    requireRole(auth, 'admin');
    const { CategoryModel } = await import('../models/Category.js');
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const saved = await CategoryModel.findOneAndUpdate(
      { id },
      { $set: body },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return saved.toJSON();
  });

  app.delete('/v1/admin/categories/:id', async (request) => {
    const auth = await requireAuth(request);
    requireRole(auth, 'admin');
    const { CategoryModel } = await import('../models/Category.js');
    const { id } = request.params as { id: string };
    await CategoryModel.deleteOne({ id });
    return { success: true };
  });

  /* ── Gallery ────────────────────────────────────────────────── */

  app.get('/v1/admin/gallery', async (request) => {
    await requireAuth(request);
    const { GalleryItemModel } = await import('../models/GalleryItem.js');
    const items = await GalleryItemModel.find().sort({ updatedAt: -1 });
    return { items: items.map((i) => i.toJSON()) };
  });

  app.put('/v1/admin/gallery/:id', async (request) => {
    await requireAuth(request);
    const { GalleryItemModel } = await import('../models/GalleryItem.js');
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const saved = await GalleryItemModel.findOneAndUpdate(
      { id },
      { $set: body },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return saved.toJSON();
  });

  app.delete('/v1/admin/gallery/:id', async (request) => {
    await requireAuth(request);
    const { GalleryItemModel } = await import('../models/GalleryItem.js');
    const { id } = request.params as { id: string };
    await GalleryItemModel.deleteOne({ id });
    return { success: true };
  });
}
