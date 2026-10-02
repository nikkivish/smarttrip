import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';

import { createApp } from '../src/app';
import { prisma } from '../src/db';

const results: { name: string; ok: boolean; error?: string }[] = [];

async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  PASS  ${name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ name, ok: false, error: message });
    console.log(`  FAIL  ${name}\n        ${message}`);
  }
}

const app = createApp();
const server = app.listen(0);
await new Promise((resolve) => server.once('listening', resolve));

const { port } = server.address() as AddressInfo;
const base = `http://127.0.0.1:${port}/api/v1`;
console.log(`\nSmartTrip API smoke test (port ${port})\n`);

let token = '';
let tripId = '';
const email = `smoke-${Date.now()}@smarttrip.app`;

async function api<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.auth ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${path} -> ${response.status} ${JSON.stringify(payload)}`);
  }
  return payload as T;
}

await step('GET /health', async () => {
  const res = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(res.status, 200);
  const body = (await res.json()) as { status: string };
  assert.equal(body.status, 'ok');
});

await step('POST /auth/register', async () => {
  const session = await api<{ token: string; user: { id: string; email: string } }>(
    '/auth/register',
    { method: 'POST', body: JSON.stringify({ name: 'Smoke Tester', email, password: 'supersecret1' }) },
  );
  assert.ok(session.token);
  assert.equal(session.user.email, email);
  token = session.token;
});

await step('POST /auth/register rejects duplicate email', async () => {
  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Dupe', email, password: 'supersecret1' }),
  });
  assert.equal(res.status, 409);
});

await step('POST /auth/login with wrong password is rejected', async () => {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'wrongpassword' }),
  });
  assert.equal(res.status, 401);
});

await step('GET /auth/me requires a token', async () => {
  const res = await fetch(`${base}/auth/me`);
  assert.equal(res.status, 401);
});

await step('GET /auth/me returns the user', async () => {
  const me = await api<{ email: string; emergencyContacts: unknown[] }>('/auth/me', { auth: true });
  assert.equal(me.email, email);
  assert.ok(Array.isArray(me.emergencyContacts));
});

await step('POST /auth/login', async () => {
  const session = await api<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'supersecret1' }),
  });
  assert.ok(session.token);
});

await step('POST /auth/register validates input', async () => {
  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'A', email: 'not-an-email', password: 'short' }),
  });
  assert.equal(res.status, 400);
});

await step('POST /safety/contacts', async () => {
  const contact = await api<{ id: string; isPrimary: boolean }>('/safety/contacts', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ name: 'Rohit', phone: '+919876500011', relation: 'Brother', isPrimary: true }),
  });
  assert.ok(contact.id);
  assert.equal(contact.isPrimary, true);
});

await step('POST /safety/contacts demotes the previous primary', async () => {
  await api('/safety/contacts', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ name: 'Priya', phone: '+919876500022', relation: 'Friend', isPrimary: true }),
  });
  const contacts = await api<{ name: string; isPrimary: boolean }[]>('/safety/contacts', { auth: true });
  assert.equal(contacts.filter((c) => c.isPrimary).length, 1);
  assert.equal(contacts.find((c) => c.isPrimary)?.name, 'Priya');
});

await step('POST /trips creates a trip', async () => {
  const trip = await api<{ id: string; status: string }>('/trips', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({
      destination: 'Udaipur, Rajasthan',
      startDate: '2026-12-01',
      endDate: '2026-12-05',
      travellers: 2,
      budget: 30000,
    }),
  });
  assert.ok(trip.id);
  assert.equal(trip.status, 'DRAFT');
  tripId = trip.id;
});

await step('POST /trips rejects endDate before startDate', async () => {
  const res = await fetch(`${base}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ destination: 'Nowhere', startDate: '2026-12-05', endDate: '2026-12-01' }),
  });
  assert.equal(res.status, 400);
});

await step('POST /trips/:id/generate builds an itinerary', async () => {
  const result = await api<{
    source: string;
    safetyNotes: string[];
    trip: { status: string; safetyScore: number; itinerary: { day: number; items: unknown[] }[] };
  }>(`/trips/${tripId}/generate`, { method: 'POST', auth: true });

  assert.equal(result.trip.status, 'PLANNING');
  assert.ok(result.trip.safetyScore > 0);
  assert.ok(result.trip.itinerary.length > 0, 'expected at least one itinerary day');
  assert.ok(result.trip.itinerary.every((d) => d.items.length > 0), 'every day needs items');
  assert.ok(result.safetyNotes.length > 0, 'expected safety notes');
});

await step('GET /trips/:id returns the trip with itinerary', async () => {
  const trip = await api<{ id: string; itinerary: { items: { title: string }[] }[] }>(
    `/trips/${tripId}`,
    { auth: true },
  );
  assert.equal(trip.id, tripId);
  const firstItem = trip.itinerary[0]?.items[0];
  assert.ok(firstItem?.title, 'expected itinerary items to have titles');
});

await step('GET /trips/:id rejects another user', async () => {
  const other = await api<{ token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Other', email: `other-${Date.now()}@smarttrip.app`, password: 'supersecret1' }),
  });
  const res = await fetch(`${base}/trips/${tripId}`, {
    headers: { Authorization: `Bearer ${other.token}` },
  });
  assert.equal(res.status, 404);
});

await step('POST /safety/sos records a critical alert', async () => {
  const result = await api<{
    alert: { type: string; severity: string };
    notified: { delivered: number; failed: number; simulated: boolean; message: string };
  }>('/safety/sos', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ latitude: 9.93123, longitude: 77.2673, tripId }),
  });
  assert.equal(result.alert.type, 'SOS');
  assert.equal(result.alert.severity, 'CRITICAL');
  // No SMS provider is configured in tests, so the alert must report honestly
  // that nothing was transmitted instead of claiming 2 deliveries.
  assert.equal(result.notified.simulated, true);
  assert.equal(result.notified.delivered, 0);
  assert.equal(result.notified.failed, 2);
  assert.match(result.notified.message, /URGENT/);
});

await step('POST /safety/sos rejects out-of-range coordinates', async () => {
  const res = await fetch(`${base}/safety/sos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ latitude: 999, longitude: 0 }),
  });
  assert.equal(res.status, 400);
});

await step('POST /safety/check-ins records a check-in', async () => {
  const result = await api<{ checkIn: { note: string | null } }>('/safety/check-ins', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ latitude: 9.93123, longitude: 77.2673, note: 'Reached the hotel' }),
  });
  assert.equal(result.checkIn.note, 'Reached the hotel');
});

await step('GET /safety/alerts lists alerts newest first', async () => {
  const alerts = await api<{ type: string }[]>('/safety/alerts', { auth: true });
  assert.ok(alerts.length >= 2);
  assert.equal(alerts[0]?.type, 'CHECK_IN');
});

await step('PATCH /safety/alerts/:id/acknowledge', async () => {
  const alerts = await api<{ id: string; acknowledged: boolean }[]>('/safety/alerts', { auth: true });
  const target = alerts.find((a) => !a.acknowledged);
  assert.ok(target, 'expected an unacknowledged alert');
  const updated = await api<{ acknowledged: boolean }>(`/safety/alerts/${target.id}/acknowledge`, {
    method: 'PATCH',
    auth: true,
  });
  assert.equal(updated.acknowledged, true);
});

await step('PATCH /trips/:id updates status', async () => {
  const trip = await api<{ status: string }>(`/trips/${tripId}`, {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify({ status: 'CONFIRMED' }),
  });
  assert.equal(trip.status, 'CONFIRMED');
});

let assistantItinerary: {
  title: string;
  summary: string;
  destination: string;
  safetyScore: number;
  safetyLevel: string;
  safetyNotes: string[];
  days: { day: number; title: string; summary: string; items: unknown[] }[];
} | null = null;

await step('POST /assistant/message requires a token', async () => {
  const res = await fetch(`${base}/assistant/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Plan a 3 day trip' }),
  });
  assert.equal(res.status, 401);
});

await step('POST /assistant/message asks for missing details', async () => {
  const reply = await api<{
    intent: string;
    reply: string;
    missingDetails: string[];
    itinerary?: unknown;
    details: { days?: number; budget?: number };
  }>('/assistant/message', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ message: 'Plan a 3-day trip under \u20b910,000' }),
  });

  assert.equal(reply.intent, 'itinerary');
  assert.equal(reply.itinerary, undefined, 'must not generate before details are known');
  assert.ok(reply.reply.length > 0);
  // Duration and budget were readable from the prompt itself.
  assert.equal(reply.details.days, 3);
  assert.equal(reply.details.budget, 10000);
  assert.ok(reply.missingDetails.includes('destination'));
  assert.ok(reply.missingDetails.includes('travellers'));
});

await step('POST /assistant/message generates once details are known', async () => {
  const reply = await api<{
    intent: string;
    source: string;
    missingDetails: string[];
    itinerary: { days: { items: unknown[] }[]; safetyNotes: string[] } | undefined;
  }>('/assistant/message', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({
      message: 'Plan my trip',
      details: { destination: 'Coorg, Karnataka', days: 3, budget: 10000, travellers: 1 },
    }),
  });

  assert.equal(reply.intent, 'itinerary');
  assert.deepEqual(reply.missingDetails, []);
  assert.ok(['ai', 'mock'].includes(reply.source));
  assert.ok(reply.itinerary, 'expected an itinerary');
  assert.equal(reply.itinerary.days.length, 3, 'expected three days');
  assert.ok(reply.itinerary.days.every((d) => d.items.length > 0), 'every day needs items');
  assistantItinerary = reply.itinerary as typeof assistantItinerary;
});

await step('POST /assistant/message treats "Suggest a solo trip" as a plan', async () => {
  const reply = await api<{ intent: string; missingDetails: string[]; details: { travellers?: number } }>(
    '/assistant/message',
    {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ message: 'Suggest a solo trip' }),
    },
  );

  assert.equal(reply.intent, 'itinerary');
  assert.equal(reply.details.travellers, 1, 'solo should mean one traveller');
  assert.ok(reply.missingDetails.includes('destination'));
});

await step('POST /assistant/message continues collecting across turns', async () => {
  const first = await api<{ details: Record<string, unknown> }>('/assistant/message', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ message: 'Create a relaxed weekend itinerary' }),
  });
  assert.equal(first.details.days, 2, 'a weekend should mean two days');
  assert.equal(first.details.pace, 'relaxed');

  // The client sends the collected details back on the next turn, as the
  // mobile chat does.
  const second = await api<{
    intent: string;
    itinerary?: { destination: string };
    details: { destination?: string };
  }>('/assistant/message', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({
      message: 'Go to Coorg, travelling solo',
      details: { ...first.details, budget: 8000 },
    }),
  });

  assert.equal(second.intent, 'itinerary');
  assert.equal(second.details.destination, 'Coorg');
  assert.ok(second.itinerary, 'expected the plan once every detail is known');
  assert.equal(second.itinerary.destination, 'Coorg');
});

await step('POST /assistant/message answers a packing question', async () => {
  const reply = await api<{ intent: string; reply: string }>('/assistant/message', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ message: 'What should I pack?' }),
  });

  assert.equal(reply.intent, 'advice');
  assert.ok(reply.reply.length > 0);
});

await step('POST /assistant/message rejects an empty message', async () => {
  const res = await fetch(`${base}/assistant/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: '   ' }),
  });
  assert.equal(res.status, 400);
});

let adoptedTripId = '';

await step('POST /assistant/adopt saves a new trip', async () => {
  assert.ok(assistantItinerary, 'expected an itinerary to adopt');
  const result = await api<{
    created: boolean;
    trip: { id: string; status: string; safetyScore: number; itinerary: unknown[] };
  }>('/assistant/adopt', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({
      itinerary: assistantItinerary,
      destination: 'Coorg, Karnataka',
      startDate: '2026-11-10',
      endDate: '2026-11-12',
      travellers: 1,
      budget: 10000,
    }),
  });

  assert.equal(result.created, true);
  assert.ok(result.trip.id);
  assert.equal(result.trip.status, 'PLANNING');
  assert.equal(result.trip.itinerary.length, 3);
  adoptedTripId = result.trip.id;
});

await step('POST /assistant/adopt overwrites an existing trip', async () => {
  assert.ok(assistantItinerary, 'expected an itinerary to adopt');
  const result = await api<{ created: boolean; trip: { itinerary: unknown[] } }>(
    '/assistant/adopt',
    {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        tripId,
        itinerary: assistantItinerary,
        destination: 'Udaipur, Rajasthan',
        startDate: '2026-12-01',
        endDate: '2026-12-05',
        travellers: 2,
        budget: 30000,
      }),
    },
  );

  assert.equal(result.created, false);
  assert.equal(result.trip.itinerary.length, 3, 'the previous itinerary must be replaced');
});

await step('POST /assistant/adopt rejects another user trip', async () => {
  assert.ok(assistantItinerary, 'expected an itinerary to adopt');
  const other = await api<{ token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Other', email: `ai-${Date.now()}@smarttrip.app`, password: 'supersecret1' }),
  });

  const res = await fetch(`${base}/assistant/adopt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${other.token}` },
    body: JSON.stringify({
      tripId: adoptedTripId,
      itinerary: assistantItinerary,
      destination: 'Coorg, Karnataka',
      startDate: '2026-11-10',
      endDate: '2026-11-12',
    }),
  });
  assert.equal(res.status, 404);
});

await step('POST /assistant/adopt rejects endDate before startDate', async () => {
  assert.ok(assistantItinerary, 'expected an itinerary to adopt');
  const res = await fetch(`${base}/assistant/adopt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      itinerary: assistantItinerary,
      destination: 'Coorg, Karnataka',
      startDate: '2026-11-12',
      endDate: '2026-11-10',
    }),
  });
  assert.equal(res.status, 400);
});

await step('DELETE /trips/:id', async () => {
  const res = await fetch(`${base}/trips/${tripId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(res.status, 204);
});

await step('unknown route returns 404 JSON', async () => {
  const res = await fetch(`${base}/does-not-exist`);
  assert.equal(res.status, 404);
  const body = (await res.json()) as { message: string };
  assert.ok(body.message);
});

server.close();
await prisma.$disconnect();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed\n`);
process.exit(failed.length === 0 ? 0 : 1);
