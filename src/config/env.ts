import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/restopilot'),
  JWT_ACCESS_SECRET: z.string().default('fallback_access_secret_do_not_use_in_prod'),
  JWT_REFRESH_SECRET: z.string().default('fallback_refresh_secret_do_not_use_in_prod'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('365d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('365d'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.string().default('info'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
