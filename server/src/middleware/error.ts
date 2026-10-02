import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { isProd } from '../env';
import { HttpError } from '../lib/http-error';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `No route for ${req.method} ${req.path}` });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, details: err.details });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Validation failed',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unexpected error';
  if (!isProd) console.error('[error]', err);
  res.status(500).json({ message: 'Something went wrong on our side', ...(isProd ? {} : { detail: message }) });
}
