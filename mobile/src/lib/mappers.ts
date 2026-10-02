import type { ItineraryDay, ItineraryItem, SafetyAlert, Trip, User } from '@/types';

type Lower<S extends string> = Lowercase<S>;

const lower = <S extends string>(value: S): Lower<S> => value.toLowerCase() as Lower<S>;

const safetyLevels = ['safe', 'caution', 'risk'] as const;
const alertTypes = ['check_in', 'sos', 'area_risk', 'contact'] as const;
const severities = ['info', 'warning', 'critical'] as const;
const categories = ['transport', 'stay', 'food', 'activity', 'shopping'] as const;

function oneOf<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export type WireContact = {
  id: string;
  name: string;
  phone: string;
  relation: string;
  isPrimary: boolean;
};

export type WireUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  emergencyContacts: WireContact[];
};

export const mapUser = (u: WireUser): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone ?? undefined,
  avatarUrl: u.avatarUrl ?? undefined,
  emergencyContacts: u.emergencyContacts.map((c) => ({ ...c })),
});

export type WireTrip = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImageUrl?: string | null;
  status: string;
  travellers: number;
  budget?: number | null;
  currency?: string | null;
  safetyScore?: number | null;
  safetyLevel?: string | null;
  summary?: string | null;
  createdAt: string;
};

export const mapTrip = (t: WireTrip): Trip => ({
  id: t.id,
  title: t.title,
  destination: t.destination,
  startDate: t.startDate,
  endDate: t.endDate,
  coverImageUrl: t.coverImageUrl ?? undefined,
  status: lower(t.status) as Trip['status'],
  travellers: t.travellers,
  budget: t.budget ?? undefined,
  currency: t.currency ?? undefined,
  safetyScore: t.safetyScore ?? undefined,
  safetyLevel: t.safetyLevel
    ? oneOf(lower(t.safetyLevel), safetyLevels, 'safe')
    : undefined,
  summary: t.summary ?? undefined,
  createdAt: t.createdAt,
});

type WireItem = {
  id: string;
  time: string;
  title: string;
  description?: string | null;
  category: string;
  cost?: number | null;
  safetyLevel?: string | null;
  placeLabel?: string | null;
  imageUrl?: string | null;
};

export type WireItineraryItem = WireItem;

const mapItem = (i: WireItem): ItineraryItem => ({
  id: i.id,
  time: i.time,
  title: i.title,
  description: i.description ?? undefined,
  category: oneOf(lower(i.category), categories, 'activity'),
  cost: i.cost ?? undefined,
  safetyLevel: i.safetyLevel ? oneOf(lower(i.safetyLevel), safetyLevels, 'safe') : undefined,
  placeLabel: i.placeLabel ?? undefined,
  location: undefined,
  imageUrl: i.imageUrl ?? undefined,
});

type WireDay = {
  id: string;
  day: number;
  date: string;
  title: string;
  summary?: string | null;
  items: WireItem[];
};

export type WireItineraryDay = WireDay;

const mapDay = (d: WireDay): ItineraryDay => ({
  day: d.day,
  date: d.date,
  title: d.title,
  items: d.items.map(mapItem),
});

export type WireTripWithItinerary = WireTrip & { itinerary?: WireDay[] };

export const mapTripWithItinerary = (
  t: WireTripWithItinerary,
): Trip & { itinerary: ItineraryDay[] } => ({
  ...mapTrip(t),
  itinerary: (t.itinerary ?? []).map(mapDay),
});

type WireAlert = {
  id: string;
  tripId?: string | null;
  type: string;
  severity: string;
  message: string;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  acknowledged: boolean;
};

export type WireSafetyAlert = WireAlert;

export const mapAlert = (a: WireAlert): SafetyAlert => ({
  id: a.id,
  tripId: a.tripId ?? undefined,
  type: oneOf(lower(a.type), alertTypes, 'contact'),
  severity: oneOf(lower(a.severity), severities, 'info'),
  message: a.message,
  location:
    a.latitude != null && a.longitude != null
      ? { latitude: a.latitude, longitude: a.longitude }
      : undefined,
  createdAt: a.createdAt,
  acknowledged: a.acknowledged,
});

export const mapAlertList = (list: WireAlert[]) => list.map(mapAlert);
