import { createApp } from './app';
import { prisma } from './db';
import { env } from './env';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`SmartTrip API listening on http://localhost:${env.PORT}/api/v1`);
});

async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
