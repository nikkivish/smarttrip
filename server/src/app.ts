import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env, isProd } from './env';
import { errorHandler, notFoundHandler } from './middleware/error';
import { authRouter } from './routes/auth.routes';
import { tripsRouter } from './routes/trips.routes';
import { safetyRouter } from './routes/safety.routes';
import { assistantRouter } from './routes/assistant.routes';
import { analyticsRouter } from './routes/analytics.routes';

/**
 * Accepts a comma-separated allowlist so a stray comma cannot silently produce
 * one unusable origin. `*` (or an empty value) keeps the reflect-any behaviour.
 */
function allowedOrigins(value: string): true | string[] {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0 || origins.includes('*')) {
    return true;
  }

  return origins;
}

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: isProd ? allowedOrigins(env.CORS_ORIGIN) : true }));
  app.use(express.json({ limit: '1mb' }));

  if (!isProd) {
    app.use(morgan('dev'));
  }

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'smarttrip-api',
      uptime: process.uptime(),
    });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/trips', tripsRouter);
  app.use('/api/v1/safety', safetyRouter);
  app.use('/api/v1/assistant', assistantRouter);
  app.use('/api/v1/analytics', analyticsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}