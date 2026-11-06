import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const optionalString = z
  .string()
  .optional()
  .transform((value) => (value ?? '').trim());

const booleanString = z
  .string()
  .optional()
  .transform((value) => (value ?? 'false').trim().toLowerCase() || 'false')
  .pipe(z.enum(['true', 'false']))
  .transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().min(2).default('1d'),
  CLIENT_URL: z.string().min(1).default('http://localhost:5173'),
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
  DEMO_MODE: booleanString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration — ${details}`);
}

export const env = {
  ...parsed.data,
  IS_PRODUCTION: parsed.data.NODE_ENV === 'production',
  CLOUDINARY_CONFIGURED: Boolean(
    parsed.data.CLOUDINARY_CLOUD_NAME &&
      parsed.data.CLOUDINARY_API_KEY &&
      parsed.data.CLOUDINARY_API_SECRET,
  ),
  ALLOWED_ORIGINS: parsed.data.CLIENT_URL.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
} as const;

export type Env = typeof env;
