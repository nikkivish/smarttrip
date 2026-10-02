import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import { buildMockPlan } from '../src/services/ai.service';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required to seed the database');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const DEMO_EMAIL = 'demo@smarttrip.app';
const DEMO_PASSWORD = 'smarttrip123';

async function main() {
  console.log('Seeding SmartTrip demo data...');

  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      name: 'Neha Sharma',
      email: DEMO_EMAIL,
      password: await bcrypt.hash(DEMO_PASSWORD, 12),
      phone: '+919876543210',
      emergencyContacts: {
        create: [
          {
            name: 'Rohit Sharma',
            phone: '+919876500011',
            relation: 'Brother',
            isPrimary: true,
          },
          { name: 'Priya Menon', phone: '+919876500022', relation: 'Friend' },
        ],
      },
    },
  });

  const trip = await prisma.trip.create({
    data: {
      userId: user.id,
      title: 'Kerala backwaters',
      destination: 'Alleppey, Kerala',
      startDate: new Date('2026-11-04T00:00:00.000Z'),
      endDate: new Date('2026-11-09T00:00:00.000Z'),
      travellers: 2,
      budget: 42000,
      currency: 'INR',
      status: 'PLANNING',
    },
  });

  const plan = buildMockPlan({
    destination: trip.destination,
    startDate: trip.startDate.toISOString(),
    endDate: trip.endDate.toISOString(),
    travellers: trip.travellers,
    budget: trip.budget ?? undefined,
    currency: trip.currency,
  });

  for (const day of plan.days) {
    const stored = await prisma.itineraryDay.create({
      data: {
        tripId: trip.id,
        day: day.day,
        date: new Date(trip.startDate.getTime() + (day.day - 1) * 86_400_000),
        title: day.title,
        summary: day.summary,
      },
    });

    await prisma.itineraryItem.createMany({
      data: day.items.map((item) => ({
        dayId: stored.id,
        time: item.time,
        title: item.title,
        description: item.description,
        category: item.category,
        cost: item.cost,
        safetyLevel: item.safetyLevel,
        placeLabel: item.placeLabel,
      })),
    });
  }

  await prisma.trip.update({
    where: { id: trip.id },
    data: {
      title: plan.title,
      summary: plan.summary,
      safetyScore: plan.safetyScore,
      safetyLevel: plan.safetyLevel,
    },
  });

  await prisma.alert.create({
    data: {
      userId: user.id,
      tripId: trip.id,
      type: 'AREA_RISK',
      severity: 'WARNING',
      message: 'Pickpocketing reported near Fort Kochi market between 18:00 and 21:00.',
    },
  });

  console.log(`Seeded user ${DEMO_EMAIL} (password: ${DEMO_PASSWORD}) with trip "${plan.title}".`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
