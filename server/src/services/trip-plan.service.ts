import { prisma } from '../db';
import { HttpError } from '../lib/http-error';
import type { TripPlan } from './ai.service';

export const itineraryInclude = {
  itinerary: { orderBy: { day: 'asc' as const }, include: { items: true } },
};

/**
 * Replaces a trip's itinerary with the supplied plan. Shared by
 * POST /trips/:id/generate and the assistant so there is one persistence path.
 */
export async function persistTripPlan(tripId: string, plan: TripPlan) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw HttpError.notFound('Trip not found');

    await tx.itineraryDay.deleteMany({ where: { tripId } });

    await tx.itineraryDay.createMany({
      data: plan.days.map((day) => ({
        tripId,
        day: day.day,
        date: new Date(trip.startDate.getTime() + (day.day - 1) * 86_400_000),
        title: day.title,
        summary: day.summary,
      })),
    });

    const storedDays = await tx.itineraryDay.findMany({ where: { tripId } });
    for (const day of storedDays) {
      const planDay = plan.days.find((d) => d.day === day.day);
      if (!planDay) continue;
      await tx.itineraryItem.createMany({
        data: planDay.items.map((item) => ({
          dayId: day.id,
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

    return tx.trip.update({
      where: { id: tripId },
      data: {
        title: plan.title,
        summary: plan.summary,
        safetyScore: plan.safetyScore,
        safetyLevel: plan.safetyLevel,
        status: 'PLANNING',
      },
      include: itineraryInclude,
    });
  });
}