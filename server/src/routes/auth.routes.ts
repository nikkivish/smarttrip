import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '../db';
import { getUserId, requireAuth } from '../middleware/auth';
import { loginRateLimit, registerRateLimit } from '../middleware/rate-limit';
import { HttpError } from '../lib/http-error';
import { signToken } from '../lib/jwt';
import { validate } from '../lib/validate';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  phone: z.string().trim().min(6).max(20).optional(),
});

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

const toPublicUser = (user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  emergencyContacts: { id: string; name: string; phone: string; relation: string; isPrimary: boolean }[];
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone ?? undefined,
  avatarUrl: user.avatarUrl ?? undefined,
  emergencyContacts: user.emergencyContacts,
});

const userInclude = { emergencyContacts: true } as const;

authRouter.post('/register', registerRateLimit, validate(registerSchema), async (req, res) => {
  const { name, email, password, phone } = req.body as z.infer<typeof registerSchema>;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw HttpError.conflict('An account with that email already exists');

  const user = await prisma.user.create({
    data: { name, email, password: await bcrypt.hash(password, 12), phone },
    include: userInclude,
  });

  res.status(201).json({ token: signToken({ sub: user.id, email: user.email }), user: toPublicUser(user) });
});

authRouter.post('/login', loginRateLimit, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;

  const user = await prisma.user.findUnique({ where: { email }, include: userInclude });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw HttpError.unauthorized('Email or password is incorrect');
  }

  res.json({ token: signToken({ sub: user.id, email: user.email }), user: toPublicUser(user) });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: getUserId(req) }, include: userInclude });
  if (!user) throw HttpError.notFound('User not found');
  res.json(toPublicUser(user));
});
