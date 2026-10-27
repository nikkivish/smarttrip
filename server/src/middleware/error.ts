import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { isProd } from '../env';
import { HttpError } from '../lib/http-error';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `No route for ${req.method} ${req.path}` });
}

const unavailableMessages: Record<string, string> = {
  P1001: 'Our database is temporarily unavailable. Please try again in a moment.',
  P1002: 'Our database took too long to respond. Please try again in a moment.',
};

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

  const code =
    typeof err === 'object' && err !== null ? (err as { code?: unknown }).code : undefined;
  const unavailable = typeof code === 'string' ? unavailableMessages[code] : undefined;
  if (unavailable) {
    res.status(503).json({ message: unavailable, ...(isProd ? {} : { detail: message }) });
    return;
  }

  res.status(500).json({ message: 'Something went wrong on our side', ...(isProd ? {} : { detail: message }) });
}
