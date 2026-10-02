import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/smarttrip?sslmode=disable',
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
