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

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: isProd ? env.CORS_ORIGIN : true }));
  app.use(express.json({ limit: '1mb' }));
  if (!isProd) app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'smarttrip-api', uptime: process.uptime() });
  });

  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/trips', tripsRouter);
  app.use('/api/v1/safety', safetyRouter);
  app.use('/api/v1/assistant', assistantRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
