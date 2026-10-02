import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../db';
import { getUserId, requireAuth } from '../middleware/auth';
import { HttpError } from '../lib/http-error';
import { validate } from '../lib/validate';
import { generateTripPlan } from '../services/ai.service';
import { itineraryInclude, persistTripPlan } from '../services/trip-plan.service';

export const tripsRouter = Router();
tripsRouter.use(requireAuth);

const createSchema = z.object({
  destination: z.string().trim().min(2).max(120),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  travellers: z.coerce.number().int().min(1).max(20).default(1),
  budget: z.coerce.number().nonnegative().optional(),
  currency: z.string().trim().length(3).default('INR'),
  title: z.string().trim().max(120).optional(),
});

const idSchema = z.object({ id: z.string().min(1) });

tripsRouter.get('/', async (req, res) => {
  const trips = await prisma.trip.findMany({
    where: { userId: getUserId(req) },
    orderBy: { startDate: 'asc' },
  });
  res.json(trips);
});

tripsRouter.post('/', validate(createSchema), async (req, res) => {
  const body = req.body as z.infer<typeof createSchema>;
  const userId = getUserId(req);

  if (body.endDate <= body.startDate) {
    throw HttpError.badRequest('endDate must be after startDate');
  }

  const trip = await prisma.trip.create({
    data: {
      userId,
      title: body.title ?? `Trip to ${body.destination}`,
      destination: body.destination,
      startDate: body.startDate,
      endDate: body.endDate,
      travellers: body.travellers,
      budget: body.budget,
      currency: body.currency,
    },
  });

  res.status(201).json(trip);
});

/**
 * Generates an AI itinerary and persists it against the trip.
 */
tripsRouter.post('/:id/generate', validate(idSchema, 'params'), async (req, res) => {
  const { id } = req.params as z.infer<typeof idSchema>;
  const userId = getUserId(req);

  const trip = await prisma.trip.findFirst({ where: { id, userId } });
  if (!trip) throw HttpError.notFound('Trip not found');

  const { plan, source } = await generateTripPlan({
    destination: trip.destination,
    startDate: trip.startDate.toISOString(),
    endDate: trip.endDate.toISOString(),
    travellers: trip.travellers,
    budget: trip.budget ?? undefined,
    currency: trip.currency,
  });

  const updated = await persistTripPlan(trip.id, plan);

  res.json({ trip: updated, source, safetyNotes: plan.safetyNotes });
});

tripsRouter.get('/:id', validate(idSchema, 'params'), async (req, res) => {
  const { id } = req.params as z.infer<typeof idSchema>;
  const trip = await prisma.trip.findFirst({
    where: { id, userId: getUserId(req) },
    include: itineraryInclude,
  });
  if (!trip) throw HttpError.notFound('Trip not found');
  res.json(trip);
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  status: z.enum(['DRAFT', 'PLANNING', 'CONFIRMED', 'ACTIVE', 'COMPLETED']).optional(),
  travellers: z.coerce.number().int().min(1).max(20).optional(),
  budget: z.coerce.number().nonnegative().nullable().optional(),
});

tripsRouter.patch('/:id', validate(idSchema, 'params'), validate(updateSchema), async (req, res) => {
  const { id } = req.params as z.infer<typeof idSchema>;
  const userId = getUserId(req);

  const existing = await prisma.trip.findFirst({ where: { id, userId } });
  if (!existing) throw HttpError.notFound('Trip not found');

  const trip = await prisma.trip.update({ where: { id }, data: req.body as z.infer<typeof updateSchema> });
  res.json(trip);
});

tripsRouter.delete('/:id', validate(idSchema, 'params'), async (req, res) => {
  const { id } = req.params as z.infer<typeof idSchema>;
  const userId = getUserId(req);

  const existing = await prisma.trip.findFirst({ where: { id, userId } });
  if (!existing) throw HttpError.notFound('Trip not found');

  await prisma.trip.delete({ where: { id } });
  res.status(204).send();
});
