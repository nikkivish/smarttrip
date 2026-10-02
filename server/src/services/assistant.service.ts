import { z } from 'zod';

import { env } from '../env';
import { HttpError } from '../lib/http-error';
import {
  type TripPlan,
  generateTripPlan,
  requestProviderJson,
} from './ai.service';

export type AssistantIntent = 'itinerary' | 'advice';

export type MissingDetail = 'destination' | 'dates' | 'budget' | 'travellers';

export type AssistantDetails = {
  destination?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  budget?: number;
  travellers?: number;
  interests?: string[];
  pace?: 'relaxed' | 'balanced' | 'packed';
};

export type AssistantTurn = {
  message: string;
  details?: AssistantDetails;
  history?: { message: string }[];
};

export type AssistantReply = {
  intent: AssistantIntent;
  reply: string;
  source: 'ai' | 'mock';
  missingDetails: MissingDetail[];
  details: AssistantDetails;
  itinerary?: TripPlan;
  safetyNotes?: string[];
};

const ADVICE_SYSTEM_PROMPT = `You are SmartTrip's travel assistant for solo female travellers.

Answer the traveller's question directly and practically in plain English.

Rules:
- Keep it under 160 words. Use short paragraphs or a compact bullet list.
- Be concrete about cost, timing and safety rather than generic encouragement.
- Never invent booking confirmations, live prices, or emergency numbers.
- If the question needs a destination you were not given, ask for it in one line.
- Packing answers should cover clothing, documents, health and safety gear.

Return only JSON matching the provided schema.`;

const adviceSchema = z.object({ reply: z.string().min(1).max(4000) });

const ITINERARY_HINTS = [
  'plan',
  'itinerary',
  'day-by-day',
  'day by day',
  'schedule',
  'trip plan',
  'how many days',
];

const ADVICE_HINTS = [
  'pack',
  'packing',
  'carry',
  'bring',
  'budget',
  'cost',
  'cheap',
  'safe',
  'safety',
  'recommend',
  'weather',
  'best time',
  'food',
  'stay',
  'hotel',
];

const INTEREST_KEYWORDS: [string, RegExp][] = [
  ['food', /\bfood\b|\beating\b|\bcafes?\b|\bfoodie\b/i],
  ['culture', /\bculture\b|\bmuseums?\b|\bheritage\b|\btemples?\b/i],
  ['history', /\bhistory\b|\bhistorical\b|\bforts?\b|\bmonuments?\b/i],
  ['nature', /\bnature\b|\bwaterfalls?\b|\bhills?\b|\bforests?\b/i],
  ['beach', /\bbeach\b|\bcoast\b|\bsea\b/i],
  ['trekking', /\btrek\b|\btrekking\b|\bhiking\b/i],
  ['shopping', /\bshopping\b|\bsouvenirs?\b|\bmarkets?\b/i],
  ['photography', /\bphoto\b|\bphotography\b|\binstagram\b/i],
  ['wellness', /\bwellness\b|\byoga\b|\bspa\b|\bretreat\b/i],
];

const BUDGET_PATTERN = /(?:₹|rs\.?|inr|usd|\$|€)\s*([\d,]+(?:\.\d+)?)\s*(k\b)?/i;
const PLAIN_BUDGET_PATTERN = /budget\s*(?:of|is|around)?\s*([\d,]+(?:\.\d+)?)\s*(k\b)?/i;
const DAYS_PATTERN = /(\d{1,2})\s*[-\s]?(?:day|days|night|nights)\b/i;

/** Frequent trip destinations, matched case-insensitively so "coorg" is caught. */
const KNOWN_DESTINATIONS = [
  'Andaman',
  'Agra',
  'Bali',
  'Bangkok',
  'Bengaluru',
  'Coorg',
  'Dubai',
  'Goa',
  'Hampi',
  'Hyderabad',
  'Jaipur',
  'Jaisalmer',
  'Kathmandu',
  'Kerala',
  'Kolkata',
  'Kumarakom',
  'Leh',
  'Manali',
  'Munnar',
  'Mumbai',
  'Ooty',
  'Pune',
  'Rishikesh',
  'Singapore',
  'Sri Lanka',
  'Udaipur',
  'Varanasi',
] as const;

const PLACE_STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'at',
  'it',
  'in',
  'is',
  'my',
  'the',
  'this',
  'trip',
  'with',
]);

/** Words that show the capture ran into a clause instead of a place name. */
const NON_PLACE_WORDS = new Set([
  'alone',
  'and',
  'couple',
  'day',
  'days',
  'family',
  'friend',
  'friends',
  'me',
  'myself',
  'night',
  'nights',
  'people',
  'solo',
  'traveling',
  'travelling',
  'trip',
  'trips',
  'weekend',
]);

/**
 * Trims clause tails such as "Coorg for 3 days with my friend". Leading clause
 * words matter as much as trailing ones: in "trip under 10,000" the capture is
 * just "under", which is why the leading form is matched too.
 */
function trimPlace(raw: string) {
  const firstClause = raw.split(
    /\s(?:for|from|during|with|near|around|starting|under|within|below|above|worth|only|just|in|at|on)\s|^(?:under|within|below|above|worth|only|just)\b/i,
  )[0];
  const cleaned = (firstClause ?? '')
    .replace(/[.,;:!?"')\]]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length < 3 || cleaned.length > 60) return undefined;
  if (PLACE_STOPWORDS.has(cleaned.toLowerCase())) return undefined;
  if (/\d/.test(cleaned)) return undefined;
  if (/[₹$€£]/.test(cleaned)) return undefined;
  if (cleaned.split(/[\s,]+/).some((word) => NON_PLACE_WORDS.has(word.toLowerCase()))) {
    return undefined;
  }
  return cleaned;
}

/**
 * Finds a destination in free text. Exact known names win, then "go to X"
 * phrasing, then a capitalised name after to/in/at.
 */
export function inferDestination(message: string): string | undefined {
  const lower = message.toLowerCase();

  for (const candidate of KNOWN_DESTINATIONS) {
    const pattern = new RegExp(`\\b${candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase()}\\b`);
    if (pattern.test(lower)) return candidate;
  }

  const verbForm = message.match(
    /\b(?:go|going|fly|travel|travelling|traveling|trip|visiting|visit|tour)\s+(?:to\s+|in\s+)?([A-Za-z][\w'’.&-]*(?:[\s,]+[A-Za-z][\w'’.&-]*){0,3})/i,
  );
  const verbPlace = verbForm?.[1] ? trimPlace(verbForm[1]) : undefined;
  if (verbPlace) return verbPlace;

  const capitalised = message.match(
    /\b(?:to|in|at)\s+([A-Z][\w'’.&-]*(?:[\s,]+[A-Z][\w'’.&-]*){0,3})/,
  );
  const capitalisedPlace = capitalised?.[1] ? trimPlace(capitalised[1]) : undefined;
  if (capitalisedPlace) return capitalisedPlace;

  return undefined;
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

const addDays = (iso: string, n: number) => {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return isoDay(date);
};

function parseAmount(value: string, thousands?: boolean) {
  const base = Number(value.replace(/,/g, ''));
  if (!Number.isFinite(base) || base <= 0) return undefined;
  return thousands ? base * 1000 : base;
}

/**
 * Pulls budget, duration, pace and interests out of free text so quick prompts
 * such as "plan a 3 day trip under 10k" work without a structured form.
 */
export function inferFromMessage(message: string): AssistantDetails {
  const inferred: AssistantDetails = {};

  const budgetMatch = message.match(BUDGET_PATTERN) ?? message.match(PLAIN_BUDGET_PATTERN);
  if (budgetMatch) {
    const budget = parseAmount(budgetMatch[1]!, budgetMatch[2] !== undefined);
    if (budget !== undefined) inferred.budget = budget;
  }

  const daysMatch = message.match(DAYS_PATTERN);
  if (daysMatch) {
    const days = Number(daysMatch[1]);
    if (Number.isInteger(days) && days >= 1 && days <= 60) inferred.days = days;
  } else if (/\bweekend\b/i.test(message)) {
    inferred.days = 2;
  }

  if (/\brelaxed\b|\bslow\b|\bleisurely\b|\bchill\b/i.test(message)) inferred.pace = 'relaxed';
  else if (/\bpacked\b|\bfast[- ]paced\b|\bmaximi[sz]e\b|\bfully loaded\b/i.test(message)) {
    inferred.pace = 'packed';
  }

  if (/\bsolo\b|\bby myself\b|\bon my own\b|\balone\b/i.test(message)) inferred.travellers = 1;
  else if (/\b(couple|2 people|two people|with my (friend|partner|bf|gf))\b/i.test(message)) {
    inferred.travellers = 2;
  }
  if (/\b(family|group|tour)\b/i.test(message) && inferred.travellers === undefined) {
    inferred.travellers = 4;
  }

  const destination = inferDestination(message);
  if (destination) inferred.destination = destination;

  const interests = INTEREST_KEYWORDS.filter(([, pattern]) => pattern.test(message)).map(
    ([label]) => label,
  );
  if (interests.length) inferred.interests = interests;

  return inferred;
}

export function detectIntent(message: string, details: AssistantDetails): AssistantIntent {
  const text = message.toLowerCase();
  const asksForPlan = ITINERARY_HINTS.some((hint) => text.includes(hint));
  const asksAdvice = ADVICE_HINTS.some((hint) => text.includes(hint));

  if (asksForPlan) return 'itinerary';

  // "Suggest a solo trip" is a plan request even without the word "plan".
  const planSpecific = /\bplan\b|\bitinerar|\bday[- ]by[- ]day\b|\btrip\b|\bweekend\b/.test(text);
  if (planSpecific && !asksAdvice) return 'itinerary';

  // Mid-conversation answers ("Coorg, just me") continue collecting details
  // rather than being treated as a fresh advice question.
  if (!asksAdvice && hasAnyDetail(details)) return 'itinerary';

  return 'advice';
}

function hasAnyDetail(details: AssistantDetails) {
  return Boolean(
    details.destination ||
      details.startDate ||
      details.days ||
      details.budget !== undefined ||
      details.travellers !== undefined,
  );
}

function hasDates(details: AssistantDetails) {
  return Boolean(
    (details.startDate && details.endDate) ||
      (details.startDate && details.days) ||
      details.days,
  );
}

export function missingFrom(details: AssistantDetails): MissingDetail[] {
  const missing: MissingDetail[] = [];
  if (!details.destination) missing.push('destination');
  if (!hasDates(details)) missing.push('dates');
  if (details.budget === undefined) missing.push('budget');
  if (details.travellers === undefined) missing.push('travellers');
  return missing;
}

const MISSING_QUESTIONS: Record<MissingDetail, string> = {
  destination: 'Where do you want to go? A city or region is enough to start.',
  dates: 'When are you travelling? A start date and number of days works best.',
  budget: 'What is your total budget for the trip?',
  travellers: 'How many people are going, and is anyone travelling solo?',
};

const DEFAULT_CURRENCY = 'INR';

function collectReply(missing: MissingDetail[], details: AssistantDetails) {
  const known: string[] = [];
  if (details.destination) known.push(`destination (${details.destination})`);
  if (details.days) known.push(`${details.days} day${details.days === 1 ? '' : 's'}`);
  if (details.budget !== undefined) known.push(`budget ${details.budget} ${DEFAULT_CURRENCY}`);
  if (details.travellers !== undefined) {
    known.push(`${details.travellers} traveller${details.travellers === 1 ? '' : 's'}`);
  }

  const questions = missing.map((key) => MISSING_QUESTIONS[key]);
  const opener =
    missing.length === 1
      ? 'One more thing before I build the plan:'
      : `I can build that. I still need ${missing.length} details:`;

  return [
    opener,
    ...questions.map((q) => `• ${q}`),
    known.length ? `\nSo far I have your ${known.join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildAdvicePrompt(message: string, details: AssistantDetails, history: AssistantTurn[]) {
  const context = history.slice(-4).map((turn) => `Traveller: ${turn.message}`);
  return [
    ...context,
    details.destination ? `Destination so far: ${details.destination}` : null,
    details.days ? `Trip length so far: ${details.days} days` : null,
    details.budget !== undefined ? `Budget so far: ${details.budget}` : null,
    details.travellers !== undefined ? `Travellers so far: ${details.travellers}` : null,
    details.interests?.length ? `Interests so far: ${details.interests.join(', ')}` : null,
    '',
    `Traveller asks: ${message}`,
  ]
    .filter(Boolean)
    .join('\n');
}

const MOCK_ADVICE: { match: RegExp; reply: string }[] = [
  {
    match: /\bpack|packing\b/i,
    reply: [
      'Demo packing list (no AI provider is configured, so this is a template):',
      '',
      'Documents: photo ID, any visa or permit, printed copies of bookings, and two emergency contacts written on paper.',
      'Clothing: layers for the forecast, one modest outfit for temples or restaurants, and comfortable shoes for long walking days.',
      'Health: any regular medication plus a basic kit, sunscreen, and a rehydration sachet.',
      'Safety gear: a small night-light, a phone power bank, a zip pouch worn across the body, and a printed copy of your accommodation address.',
      '',
      'Tell me the destination and season and I will make this specific.',
    ].join('\n'),
  },
  {
    match: /\bbudget|cost|cheap|afford\b/i,
    reply: [
      'Demo budget guide (no AI provider is configured, so this is a template):',
      '',
      'A comfortable solo day in India usually lands near INR 2,000 to 3,500:',
      '• Stay: INR 900 to 1,800 for a verified property near a main road',
      '• Food: INR 400 to 700 across two meals and a cafe stop',
      '• Transport: INR 300 to 600 for pre-booked daytime transfers',
      '• Activities: INR 300 to 900',
      '',
      'Give me your destination, days and total budget and I will split it day by day.',
    ].join('\n'),
  },
  {
    match: /\bsolo|alone|by myself\b/i,
    reply: [
      'Demo solo suggestions (no AI provider is configured, so this is a template):',
      '',
      'For a first solo trip, favour places with a compact, walkable centre and strong public transport.',
      'Plan two activities a day and keep a free evening block so nothing is rushed.',
      'Stay within ten minutes walk of a busy main road or a transit stop.',
      'Pre-book daytime transfers and confirm the vehicle over chat before boarding.',
      '',
      'Tell me the region and your budget and I will shape a day plan around it.',
    ].join('\n'),
  },
  {
    match: /\bsafe|safety|solo at night|alone at night\b/i,
    reply: [
      'Demo safety basics (no AI provider is configured, so this is a template):',
      '',
      'Share live location with an emergency contact for the duration of the trip.',
      'Avoid isolated short-cut streets after sunset even when the map says it is faster.',
      'Use the SOS tab in SmartTrip if you need to alert your contacts.',
      'Prefer well-lit, populated areas for the first two nights so you learn the neighbourhood in daylight.',
      '',
      'Tell me the destination and dates for something specific.',
    ].join('\n'),
  },
];

const MOCK_FALLBACK = [
  'Demo assistant reply (no AI provider is configured, so this is a template):',
  '',
  'I can help with trip plans, day-by-day itineraries, budgets, packing lists and solo safety advice.',
  'For a plan I need your destination, dates or number of days, total budget, and how many people are travelling.',
  'Add an OPENAI_API_KEY to the server environment to switch this assistant to live answers.',
].join('\n');

function mockAdvice(message: string) {
  return MOCK_ADVICE.find((entry) => entry.match.test(message))?.reply ?? MOCK_FALLBACK;
}

function buildSummary(plan: TripPlan, source: 'ai' | 'mock') {
  const first = plan.days[0];
  return [
    `Here is a ${plan.days.length}-day plan for ${plan.destination}: ${plan.summary}`,
    first ? `Day 1 starts with ${first.title.toLowerCase()}.` : '',
    `Safety score ${plan.safetyScore}/100 (${plan.safetyLevel.toLowerCase()}).`,
    source === 'mock'
      ? 'Heads up: no AI provider key is configured, so this itinerary is a built-in demo template.'
      : '',
    'Review it below, then save it to a new trip or an existing one.',
  ]
    .filter(Boolean)
    .join(' ');
}

export async function askAssistant(input: AssistantTurn): Promise<AssistantReply> {
  const { message } = input;
  const details: AssistantDetails = { ...input.details, ...inferFromMessage(message) };

  const intent = detectIntent(message, details);

  if (intent === 'itinerary') {
    const missing = missingFrom(details);
    if (missing.length) {
      return {
        intent,
        reply: collectReply(missing, details),
        source: env.OPENAI_API_KEY ? 'ai' : 'mock',
        missingDetails: missing,
        details,
      };
    }

    const startDate = details.startDate ?? isoDay(new Date());
    const days = details.days ?? 1;
    const endDate = details.endDate ?? addDays(startDate, days - 1);

    try {
      const { plan, source } = await generateTripPlan({
        destination: details.destination!,
        startDate,
        endDate,
        travellers: details.travellers ?? 1,
        budget: details.budget,
        interests: details.interests,
        pace: details.pace,
      });

      return {
        intent,
        reply: buildSummary(plan, source),
        source,
        missingDetails: [],
        details: { ...details, startDate, endDate },
        itinerary: plan,
        safetyNotes: plan.safetyNotes,
      };
    } catch (error) {
      throw new HttpError(
        502,
        error instanceof Error ? error.message : 'The AI provider could not be reached',
      );
    }
  }

  if (!env.OPENAI_API_KEY) {
    return {
      intent,
      reply: mockAdvice(message),
      source: 'mock',
      missingDetails: [],
      details,
    };
  }

  let reply: string;
  try {
    const result = await requestProviderJson(
      adviceSchema,
      ADVICE_SYSTEM_PROMPT,
      buildAdvicePrompt(message, details, input.history ?? []),
      0.6,
    );
    reply = result.reply;
  } catch (error) {
    throw new HttpError(
      502,
      error instanceof Error ? error.message : 'The AI provider could not be reached',
    );
  }

  return { intent, reply, source: 'ai', missingDetails: [], details };
}