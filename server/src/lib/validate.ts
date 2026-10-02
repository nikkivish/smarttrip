import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

import { HttpError } from './http-error';

type Source = 'body' | 'query' | 'params';

/**
 * Replaces the raw request value with the parsed result so handlers get typed data.
 */
export function validate<T>(schema: ZodType<T>, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(
        HttpError.badRequest(
          'Validation failed',
          result.error.issues.map((i) => ({
            field: i.path.join('.') || source,
            message: i.message,
          })),
        ),
      );
      return;
    }
    if (source === 'body') req.body = result.data;
    else
      Object.defineProperty(req, source, {
        value: result.data,
        writable: true,
        configurable: true,
      });
    next();
  };
}
