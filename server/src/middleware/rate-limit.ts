import rateLimit from 'express-rate-limit';

import { isProd } from '../env';

/**
 * Brute-force protection for the credential endpoints.
 *
 * Only failures count against the sign-in limit: a correct login must never be
 * throttled, so the limit applies to repeated *wrong* attempts from one client
 * rather than to total traffic. That is what stops password guessing while
 * leaving normal use, the smoke suite and the browser harness unaffected.
 *
 * Counters live in process memory, which suits the single instance this service
 * runs on. A multi-instance deployment would need a shared store.
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => {
    res.status(429).json({
      message: 'Too many failed sign-in attempts. Please wait a few minutes and try again.',
    });
  },
});

/**
 * Caps automated account creation. Development keeps a high ceiling so repeated
 * local smoke runs and seeded test users are never interrupted.
 */
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: isProd ? 20 : 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      message: 'Too many accounts created from this device. Please try again later.',
    });
  },
});