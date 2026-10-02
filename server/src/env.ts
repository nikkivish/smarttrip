import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z
    .string()
    .min(1)
    .refine((value) => !value.startsWith('file:'), {
      message:
        'SQLite is no longer supported. Set DATABASE_URL to a PostgreSQL connection string, for example postgresql://user:password@host:5432/db',
    }),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().default('https://api.openai.com/v1'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  CORS_ORIGIN: z.string().default('*'),
});

const PLACEHOLDER_SECRETS = new Set([
  'replace-me-with-a-long-random-string',
  'changeme',
  'secret',
  'your-secret',
]);

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and fill in the values.`);
}

const env = parsed.data;

// A copied `.env.example` still satisfies the length rule, so reject the known
// placeholders explicitly. A leaked signing key lets anyone mint valid tokens.
if (
  env.NODE_ENV === 'production' &&
  (PLACEHOLDER_SECRETS.has(env.JWT_SECRET.trim()) || env.JWT_SECRET.trim().length < 32)
) {
  throw new Error(
    'Invalid environment configuration:\n' +
      '  - JWT_SECRET: must be a real secret of at least 32 characters in production.\n' +
      '    Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"',
  );
}

export { env };
export const isProd = env.NODE_ENV === 'production';
