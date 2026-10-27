import { Router } from 'express';

import { getUserId, requireAuth } from '../middleware/auth';
import { getAnalytics } from '../services/analytics.service';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);

/**
 * Analytics for the signed-in user. The auth model has no admin role, so
 * application-wide figures are deliberately not exposed: every number is scoped
 * to the caller's own trips, itineraries, alerts and check-ins.
 */
analyticsRouter.get('/', async (req, res) => {
  res.json(await getAnalytics({ userId: getUserId(req) }));
});
