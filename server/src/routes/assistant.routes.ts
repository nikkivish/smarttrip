import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../db';
import { getUserId, requireAuth } from '../middleware/auth';
import { HttpError } from '../lib/http-error';
import { validate } from '../lib/validate';
import { tripPlanSchema } from '../services/ai.service';
import { askAssistant } from '../services/assistant.service';
import { persistTripPlan } from '../services/trip-plan.service';

export const assistantRouter = Router();
assistantRouter.use(requireAuth);

const detailsSchema = z.object({
  destination: z.string().trim().min(1).max(120).optional(),
  startDate: z.string().trim().max(40).optional(),
  endDate: z.string().trim().max(40).optional(),
  days: z.number().int().min(1).max(60).optional(),
  budget: z.number().nonnegative().optional(),
  travellers: z.number().int().min(1).max(20).optional(),
  interests: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  pace: z.enum(['relaxed', 'balanced', 'packed']).optional(),
});

const messageSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  details: detailsSchema.optional(),
  history: z.array(z.object({ message: z.string().trim().min(1).max(1000) })).max(20).optional(),
});

const adoptSchema = z.object({
  tripId: z.string().trim().min(1).optional(),
  itinerary: tripPlanSchema,
  destination: z.string().trim().min(2).max(120),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  travellers: z.coerce.number().int().min(1).max(20).default(1),
  budget: z.coerce.number().nonnegative().optional(),
  currency: z.string().trim().length(3).default('INR'),
});

assistantRouter.post('/message', validate(messageSchema), async (req, res) => {
  const reply = await askAssistant(req.body as z.infer<typeof messageSchema>);
  res.json(reply);
});

/**
 * Saves a reviewed assistant plan into a new trip or overwrites an existing one.
 */
assistantRouter.post('/adopt', validate(adoptSchema), async (req, res) => {
  const body = req.body as z.infer<typeof adoptSchema>;
  const userId = getUserId(req);

  if (body.endDate <= body.startDate) {
    throw HttpError.badRequest('endDate must be after startDate');
  }

  let tripId = body.tripId;

  if (tripId) {
    const existing = await prisma.trip.findFirst({ where: { id: tripId, userId } });
    if (!existing) throw HttpError.notFound('Trip not found');
  } else {
    const created = await prisma.trip.create({
      data: {
        userId,
        title: body.itinerary.title || `Trip to ${body.destination}`,
        destination: body.destination,
        startDate: body.startDate,
        endDate: body.endDate,
        travellers: body.travellers,
        budget: body.budget,
        currency: body.currency,
      },
    });
    tripId = created.id;
  }

  const trip = await persistTripPlan(tripId, body.itinerary);

  res.status(201).json({
    trip,
    safetyNotes: body.itinerary.safetyNotes,
    created: !body.tripId,
  });
});