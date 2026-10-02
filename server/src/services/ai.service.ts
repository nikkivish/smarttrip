import { z } from 'zod';

import { env } from '../env';

export const tripPlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  destination: z.string(),
  safetyScore: z.number().int().min(0).max(100),
  safetyLevel: z.enum(['SAFE', 'CAUTION', 'RISK']),
  safetyNotes: z.array(z.string()),
  days: z
    .array(
      z.object({
        day: z.number().int().min(1),
        title: z.string(),
        summary: z.string(),
        items: z
          .array(
            z.object({
              time: z.string(),
              title: z.string(),
              description: z.string(),
              category: z.enum(['transport', 'stay', 'food', 'activity', 'shopping']),
              cost: z.number().nonnegative().nullable(),
              safetyLevel: z.enum(['SAFE', 'CAUTION', 'RISK']).nullable(),
              placeLabel: z.string().nullable(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

export type TripPlan = z.infer<typeof tripPlanSchema>;

export type TripPlanRequest = {
  destination: string;
  startDate: string;
  endDate: string;
  travellers: number;
  budget?: number;
  currency?: string;
  interests?: string[];
  pace?: 'relaxed' | 'balanced' | 'packed';
};

const SYSTEM_PROMPT = `You are SmartTrip's travel planning and women's safety engine.

Given a destination and dates, produce a practical day-by-day itinerary that a solo female traveller would feel comfortable doing.

Rules:
- Prefer well-lit, populated, tourist-friendly areas and verified accommodation.
- Note realistic safety considerations per activity and for the destination overall.
- Keep the daily plan realistic for the given number of travellers and budget.
- Costs must be per person, in the requested currency, and must sum to a sensible daily total.
- Set safetyLevel per activity and give an overall safetyScore 0-100 for the destination.
- safetyNotes must be concrete, actionable precautions, not generic advice.

Return only JSON matching the provided schema.`;

function buildUserPrompt(input: TripPlanRequest) {
  const nights = Math.max(
    1,
    Math.round(
      (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / 86_400_000,
    ),
  );

  return [
    `Destination: ${input.destination}`,
    `Dates: ${input.startDate} to ${input.endDate} (${nights} night${nights === 1 ? '' : 's'})`,
    `Travellers: ${input.travellers}`,
    input.budget ? `Budget: ${input.budget} ${input.currency ?? 'INR'} total` : 'Budget: not specified',
    input.pace ? `Pace: ${input.pace}` : null,
    input.interests?.length ? `Interests: ${input.interests.join(', ')}` : null,
    '',
    `Produce exactly ${nights + 1} day entries, numbered 1 to ${nights + 1}.`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Single entry point to the configured provider so every AI feature shares one
 * request shape, one JSON contract and one failure mode.
 */
export async function requestProviderJson<T>(
  schema: z.ZodType<T>,
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.4,
): Promise<T> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('AI provider is not configured');

  const response = await fetch(`${env.OPENAI_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI provider returned ${response.status}: ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI provider returned an empty response');

  return schema.parse(JSON.parse(content));
}

function callOpenAi(input: TripPlanRequest): Promise<TripPlan> {
  return requestProviderJson(tripPlanSchema, SYSTEM_PROMPT, buildUserPrompt(input));
}

export function buildMockPlan(input: TripPlanRequest): TripPlan {
  const nights = Math.max(
    1,
    Math.round(
      (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / 86_400_000,
    ),
  );
  const perDay = input.budget ? Math.round(input.budget / (nights + 1)) : 2500;

  const templates: { title: string; summary: string; items: TripPlan['days'][number]['items'] }[] = [
    {
      title: `Arrival in ${input.destination}`,
      summary: 'Land, settle in and get oriented before exploring.',
      items: [
        {
          time: '10:00',
          title: 'Transfer to accommodation',
          description: 'Pre-booked transfer from the arrival point. Confirm the driver plate over a message.',
          category: 'transport',
          cost: Math.round(perDay * 0.12),
          safetyLevel: 'SAFE',
          placeLabel: `${input.destination} city centre`,
        },
        {
          time: '13:00',
          title: 'Check in and rest',
          description: 'Verified property within walking distance of a busy main road.',
          category: 'stay',
          cost: Math.round(perDay * 0.3),
          safetyLevel: 'SAFE',
          placeLabel: null,
        },
        {
          time: '16:00',
          title: 'Neighbourhood orientation walk',
          description: 'Low-key loop to learn the surroundings, note police and pharmacy locations.',
          category: 'activity',
          cost: 0,
          safetyLevel: 'SAFE',
          placeLabel: null,
        },
        {
          time: '19:30',
          title: 'Dinner at a busy spot',
          description: 'Well-lit restaurant with staff on site. Avoid isolated street food after dark.',
          category: 'food',
          cost: Math.round(perDay * 0.15),
          safetyLevel: 'SAFE',
          placeLabel: null,
        },
      ],
    },
    {
      title: 'Main sights',
      summary: 'Highest-traffic attractions, planned back to back.',
      items: [
        {
          time: '08:30',
          title: 'Breakfast',
          description: 'Eat at the hotel or a busy cafe.',
          category: 'food',
          cost: Math.round(perDay * 0.08),
          safetyLevel: 'SAFE',
          placeLabel: null,
        },
        {
          time: '10:00',
          title: 'Main attraction',
          description: 'Arrive at opening time to beat the crowd. Staffed ticket desk throughout.',
          category: 'activity',
          cost: Math.round(perDay * 0.18),
          safetyLevel: 'SAFE',
          placeLabel: null,
        },
        {
          time: '13:30',
          title: 'Lunch',
          description: 'Sit-down meal indoors.',
          category: 'food',
          cost: Math.round(perDay * 0.12),
          safetyLevel: 'SAFE',
          placeLabel: null,
        },
        {
          time: '15:30',
          title: 'Museum or cultural site',
          description: 'Indoor, guided, closes before dusk.',
          category: 'activity',
          cost: Math.round(perDay * 0.1),
          safetyLevel: 'SAFE',
          placeLabel: null,
        },
      ],
    },
    {
      title: 'Local culture and day trip',
      summary: 'A fuller day, planned to end before it gets dark.',
      items: [
        {
          time: '08:00',
          title: 'Day trip transfer',
          description: 'Shared cab or bus. Share the plate number with a contact.',
          category: 'transport',
          cost: Math.round(perDay * 0.2),
          safetyLevel: 'CAUTION',
          placeLabel: 'Outskirts',
        },
        {
          time: '11:00',
          title: 'Local market',
          description: 'Busy during the day. Keep valuables zipped and in front.',
          category: 'shopping',
          cost: Math.round(perDay * 0.15),
          safetyLevel: 'CAUTION',
          placeLabel: null,
        },
        {
          time: '14:00',
          title: 'Lunch',
          description: 'Fixed menu place near the market entrance.',
          category: 'food',
          cost: Math.round(perDay * 0.1),
          safetyLevel: 'SAFE',
          placeLabel: null,
        },
        {
          time: '16:00',
          title: 'Return transfer',
          description: 'Back to the city before evening.',
          category: 'transport',
          cost: Math.round(perDay * 0.1),
          safetyLevel: 'CAUTION',
          placeLabel: null,
        },
      ],
    },
    {
      title: 'Departure',
      summary: 'Buffer time and a calm exit.',
      items: [
        {
          time: '09:00',
          title: 'Last breakfast',
          description: 'Pack and double-check your bag.',
          category: 'food',
          cost: Math.round(perDay * 0.08),
          safetyLevel: 'SAFE',
          placeLabel: null,
        },
        {
          time: '11:00',
          title: 'Check out and store luggage',
          description: 'Use the property’s luggage room rather than carrying bags around.',
          category: 'stay',
          cost: 0,
          safetyLevel: 'SAFE',
          placeLabel: null,
        },
        {
          time: '13:00',
          title: 'Transfer to departure point',
          description: 'Pre-booked. Allow extra time for traffic.',
          category: 'transport',
          cost: Math.round(perDay * 0.12),
          safetyLevel: 'SAFE',
          placeLabel: null,
        },
      ],
    },
  ];

  const days = Array.from({ length: nights + 1 }, (_, index) => {
    const template = templates[index % templates.length]!;
    const dayStart = new Date(input.startDate);
    dayStart.setDate(dayStart.getDate() + index);

    return {
      day: index + 1,
      title: index === 0 ? `Arrival in ${input.destination}` : template.title,
      summary: template.summary,
      items: template.items,
    };
  });

  return {
    title: `${input.destination}, ${nights} night${nights === 1 ? '' : 's'}`,
    summary: `A ${input.pace ?? 'balanced'}-pace plan for ${input.destination} built around well-lit, low-traffic areas and verified stays.`,
    destination: input.destination,
    safetyScore: 78,
    safetyLevel: 'CAUTION',
    safetyNotes: [
      'Share your live location with an emergency contact for the duration of the trip.',
      'Pre-book daytime transfers and confirm driver details over chat before boarding.',
      'Prefer accommodation within 10 minutes walk of a busy main road or transit stop.',
      'Avoid isolated short-cut streets after sunset, even if the map says it is faster.',
    ],
    days,
  };
}

export async function generateTripPlan(input: TripPlanRequest): Promise<{
  plan: TripPlan;
  source: 'ai' | 'mock';
}> {
  if (env.OPENAI_API_KEY) {
    return { plan: await callOpenAi(input), source: 'ai' };
  }
  return { plan: buildMockPlan(input), source: 'mock' };
}
