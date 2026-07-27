import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { z } from 'zod';

// El .env de la raíz del monorepo es la única fuente de configuración.
// Un .env local en apps/api (si existiera) tiene prioridad para overrides.
const here = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(here, '../../.env') });
config({ path: path.resolve(here, '../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/sumak_kawsay'),
  ADMIN_ORIGIN: z.string().url().default('http://localhost:5173'),
  STOREFRONT_ORIGIN: z.string().url().default('http://localhost:4321'),
  ADMIN_API_KEY: z.string().min(12).optional(),
  ADMIN_USERNAME: z.string().min(1).default('admin'),
  ADMIN_PASSWORD: z.string().min(1).default('sumakadmin2026'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  LIBRETRANSLATE_URL: z.string().url().default('http://localhost:5000'),
  LIBRETRANSLATE_API_KEY: z.string().optional(),
  CONTACT_DESTINATION_EMAIL: z.string().email().default('tammy.vcm@gmail.com'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().default('tammy.vcm@gmail.com'),
  JWT_SECRET: z.string().min(12).default('sumak-kawsay-jwt-secret-2026'),
});

export const env = envSchema.parse(process.env);
