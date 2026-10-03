import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma CLI commands (migrate, db pull, studio) need a direct connection: Neon
// runs PgBouncer in transaction mode, which breaks the advisory locks and
// multi-statement DDL that migrations rely on. The app itself connects through
// the pooled DATABASE_URL via @prisma/adapter-pg. Set DIRECT_URL on Neon hosts.
const url =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  'postgresql://localhost:5432/smarttrip?sslmode=disable';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url,
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
