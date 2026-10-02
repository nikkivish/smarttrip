import type { NextFunction, Request, Response } from 'express';

import { verifyToken } from '../lib/jwt';
import { HttpError } from '../lib/http-error';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(HttpError.unauthorized());
    return;
  }

  try {
    const payload = verifyToken(header.slice(7).trim());
    req.userId = payload.sub;
    next();
  } catch {
    next(HttpError.unauthorized('Session expired, please sign in again'));
  }
}

export function getUserId(req: Request): string {
  if (!req.userId) throw HttpError.unauthorized();
  return req.userId;
}
