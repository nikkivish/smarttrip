import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../db';
import { getUserId, requireAuth } from '../middleware/auth';
import { HttpError } from '../lib/http-error';
import { validate } from '../lib/validate';
import { notifyEmergencyContacts } from '../services/safety.service';

export const safetyRouter = Router();
safetyRouter.use(requireAuth);

const coords = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

// --- Emergency contacts ---

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(6).max(20),
  relation: z.string().trim().min(2).max(40),
  isPrimary: z.coerce.boolean().default(false),
});

safetyRouter.get('/contacts', async (req, res) => {
  const contacts = await prisma.emergencyContact.findMany({
    where: { userId: getUserId(req) },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });
  res.json(contacts);
});

safetyRouter.post('/contacts', validate(contactSchema), async (req, res) => {
  const body = req.body as z.infer<typeof contactSchema>;
  const userId = getUserId(req);

  if (body.isPrimary) {
    await prisma.emergencyContact.updateMany({ where: { userId }, data: { isPrimary: false } });
  }

  const contact = await prisma.emergencyContact.create({ data: { userId, ...body } });
  res.status(201).json(contact);
});

const contactParams = z.object({ id: z.string().min(1) });

safetyRouter.delete('/contacts/:id', validate(contactParams, 'params'), async (req, res) => {
  const { id } = req.params as z.infer<typeof contactParams>;
  const userId = getUserId(req);

  const existing = await prisma.emergencyContact.findFirst({ where: { id, userId } });
  if (!existing) throw HttpError.notFound('Contact not found');

  await prisma.emergencyContact.delete({ where: { id } });
  res.status(204).send();
});

// --- Alerts ---

safetyRouter.get('/alerts', async (req, res) => {
  const alerts = await prisma.alert.findMany({
    where: { userId: getUserId(req) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(alerts);
});

const sosSchema = coords.extend({
  tripId: z.string().optional(),
  message: z.string().trim().max(500).optional(),
});

/**
 * Triggers an SOS: records a critical alert, logs a check-in,
 * and notifies every emergency contact.
 */
safetyRouter.post('/sos', validate(sosSchema), async (req, res) => {
  const body = req.body as z.infer<typeof sosSchema>;
  const userId = getUserId(req);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emergencyContacts: true },
  });
  if (!user) throw HttpError.notFound('User not found');

  const location = `${body.latitude.toFixed(5)}, ${body.longitude.toFixed(5)}`;

  const alert = await prisma.alert.create({
    data: {
      userId,
      tripId: body.tripId,
      type: 'SOS',
      severity: 'CRITICAL',
      message: body.message ?? `SOS triggered by ${user.name} at ${location}`,
      latitude: body.latitude,
      longitude: body.longitude,
    },
  });

  await prisma.checkIn.create({
    data: {
      userId,
      tripId: body.tripId,
      note: 'SOS triggered',
      latitude: body.latitude,
      longitude: body.longitude,
    },
  });

  const notified = await notifyEmergencyContacts({
    contacts: user.emergencyContacts.map((c) => ({ name: c.name, phone: c.phone })),
    userName: user.name,
    location,
  });

  res.status(201).json({ alert, notified });
});

const checkInSchema = coords.extend({
  tripId: z.string().optional(),
  note: z.string().trim().max(300).optional(),
});

safetyRouter.post('/check-ins', validate(checkInSchema), async (req, res) => {
  const body = req.body as z.infer<typeof checkInSchema>;
  const userId = getUserId(req);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw HttpError.notFound('User not found');

  const location = `${body.latitude.toFixed(5)}, ${body.longitude.toFixed(5)}`;

  const [checkIn, alert] = await prisma.$transaction([
    prisma.checkIn.create({
      data: {
        userId,
        tripId: body.tripId,
        note: body.note,
        latitude: body.latitude,
        longitude: body.longitude,
      },
    }),
    prisma.alert.create({
      data: {
        userId,
        tripId: body.tripId,
        type: 'CHECK_IN',
        severity: 'INFO',
        message: `${user.name} checked in at ${location}`,
        latitude: body.latitude,
        longitude: body.longitude,
      },
    }),
  ]);

  const notified = await notifyEmergencyContacts({
    contacts: (await prisma.emergencyContact.findMany({ where: { userId } })).map((c) => ({
      name: c.name,
      phone: c.phone,
    })),
    userName: user.name,
    location,
    kind: 'check-in',
  });

  res.status(201).json({ checkIn, alert, notified });
});

safetyRouter.get('/check-ins', async (req, res) => {
  const checkIns = await prisma.checkIn.findMany({
    where: { userId: getUserId(req) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(checkIns);
});

const ackSchema = z.object({ id: z.string().min(1) });

safetyRouter.patch('/alerts/:id/acknowledge', validate(ackSchema, 'params'), async (req, res) => {
  const { id } = req.params as z.infer<typeof ackSchema>;
  const userId = getUserId(req);

  const existing = await prisma.alert.findFirst({ where: { id, userId } });
  if (!existing) throw HttpError.notFound('Alert not found');

  const alert = await prisma.alert.update({ where: { id }, data: { acknowledged: true } });
  res.json(alert);
});
