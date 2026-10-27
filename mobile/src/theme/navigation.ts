import type { ImageSource } from './images';
import { images } from './images';
import type { SafetyLevel } from './colors';

/** Destinations in the existing floating and desktop navigation. */
export type TabKey = 'home' | 'explore' | 'plan' | 'trips' | 'safety' | 'analytics';

type TabMeta = {
  key: TabKey;
  label: string;
  /** Ionicons outline name. */
  icon: string;
  /** Ionicons filled name, shown on the active item. */
  iconActive: string;
  /** Expo Router path for this tab. */
  href: `/(tabs)/${TabKey}`;
};

/**
 * `as const` keeps each `href` a literal, so navigation calls such as
 * `router.navigate(tab.href)` stay type-checked against Expo Router's routes
 * instead of degrading to a plain `string`.
 */
export const tabs: readonly TabMeta[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', iconActive: 'home', href: '/(tabs)/home' },
  { key: 'explore', label: 'Explore', icon: 'compass-outline', iconActive: 'compass', href: '/(tabs)/explore' },
  { key: 'plan', label: 'Plan', icon: 'sparkles-outline', iconActive: 'sparkles', href: '/(tabs)/plan' },
  { key: 'trips', label: 'Trips', icon: 'map-outline', iconActive: 'map', href: '/(tabs)/trips' },
  { key: 'safety', label: 'Safety', icon: 'shield-checkmark-outline', iconActive: 'shield-checkmark', href: '/(tabs)/safety' },
  { key: 'analytics', label: 'Analytics', icon: 'analytics-outline', iconActive: 'analytics', href: '/(tabs)/analytics' },
] as const;

/** Declared separately so `Destination` does not reference `destinations`, which
 *  is itself typed in terms of `Destination`. */
export type DestinationSlug =
  | 'udaipur'
  | 'manali'
  | 'coorg'
  | 'goa'
  | 'jaipur'
  | 'andaman'
  | 'munnar'
  | 'varanasi';

export type Destination = {
  slug: DestinationSlug;
  name: string;
  region: string;
  blurb: string;
  rating: number;
  reviews: number;
  safetyLevel: SafetyLevel;
  safetyNote: string;
  /** From ₹ per day, for the price row on cards. */
  fromPrice: number;
  bestSeason: string;
  tags: string[];
  temperature: string;
  tripCount: string;
  /** Resolved from `images.destinations` when `destinations` is built. */
  image: ImageSource;
};

/** Entries below omit `image`; it is attached from the image registry. */
type DestinationLiteral = Omit<Destination, 'image'>;

const destinationData: Record<DestinationSlug, DestinationLiteral> = {
  udaipur: {
    slug: 'udaipur',
    name: 'Udaipur',
    region: 'Rajasthan',
    blurb: 'Lakes, palaces and a walkable old city that is calm even at sunset.',
    rating: 4.8,
    reviews: 1284,
    safetyLevel: 'safe',
    safetyNote: 'Well-lit lake promenade. Avoid the narrow lanes south of the palace after dark.',
    fromPrice: 3200,
    bestSeason: 'Oct – Mar',
    tags: ['Palaces', 'Lakes', 'Heritage'],
    temperature: '24°',
    tripCount: '2.1k trips',
  },
  manali: {
    slug: 'manali',
    name: 'Manali',
    region: 'Himachal Pradesh',
    blurb: 'Riverside stays and mountain trails, best once the monsoon clears.',
    rating: 4.6,
    reviews: 942,
    safetyLevel: 'caution',
    safetyNote: 'Check weather and road conditions before booking. Cellular coverage drops in valleys.',
    fromPrice: 2800,
    bestSeason: 'Sep – Nov',
    tags: ['Mountains', 'Trekking', 'River'],
    temperature: '18°',
    tripCount: '1.4k trips',
  },
  coorg: {
    slug: 'coorg',
    name: 'Coorg',
    region: 'Karnataka',
    blurb: 'Coffee estates and quiet plantation stays an hour from the coast.',
    rating: 4.7,
    reviews: 611,
    safetyLevel: 'safe',
    safetyNote: 'Estate roads are unlit. Book stays with a caretaker on site.',
    fromPrice: 2400,
    bestSeason: 'Nov – Feb',
    tags: ['Coffee', 'Estates', 'Quiet'],
    temperature: '21°',
    tripCount: '640 trips',
  },
  goa: {
    slug: 'goa',
    name: 'Goa',
    region: 'Konkan',
    blurb: 'Long beaches, late kitchens and easy coastal trains.',
    rating: 4.5,
    reviews: 2310,
    safetyLevel: 'caution',
    safetyNote: 'Stick to the main beach road at night and pre-book a taxi for late returns.',
    fromPrice: 2600,
    bestSeason: 'Nov – Feb',
    tags: ['Beach', 'Food', 'Nightlife'],
    temperature: '29°',
    tripCount: '3.8k trips',
  },
  jaipur: {
    slug: 'jaipur',
    name: 'Jaipur',
    region: 'Rajasthan',
    blurb: 'Pink-city landmarks, rooftop dinners and very good food markets.',
    rating: 4.7,
    reviews: 1567,
    safetyLevel: 'safe',
    safetyNote: 'Bazaars get crowded around sunset. Use a prepaid cab back to your stay.',
    fromPrice: 2900,
    bestSeason: 'Oct – Mar',
    tags: ['Culture', 'Food', 'Markets'],
    temperature: '27°',
    tripCount: '2.6k trips',
  },
  andaman: {
    slug: 'andaman',
    name: 'Andaman',
    region: 'Bay of Bengal',
    blurb: 'Clear water, small islands and a genuinely slow pace.',
    rating: 4.9,
    reviews: 733,
    safetyLevel: 'safe',
    safetyNote: 'Strong currents outside marked zones. Lifeguard beaches only.',
    fromPrice: 5400,
    bestSeason: 'Nov – Apr',
    tags: ['Islands', 'Snorkel', 'Beach'],
    temperature: '30°',
    tripCount: '980 trips',
  },
  munnar: {
    slug: 'munnar',
    name: 'Munnar',
    region: 'Kerala',
    blurb: 'Tea slopes above the clouds and cool evenings year round.',
    rating: 4.6,
    reviews: 806,
    safetyLevel: 'safe',
    safetyNote: 'Hill roads curve sharply. Avoid night drives on the G roads.',
    fromPrice: 2200,
    bestSeason: 'Sep – Mar',
    tags: ['Tea', 'Hills', 'Cool'],
    temperature: '19°',
    tripCount: '720 trips',
  },
  varanasi: {
    slug: 'varanasi',
    name: 'Varanasi',
    region: 'Uttar Pradesh',
    blurb: 'Ghats at dawn, rooftop dining and the Ganga through the day.',
    rating: 4.6,
    reviews: 1104,
    safetyLevel: 'caution',
    safetyNote: 'Dass and ghats are crowded. Keep a photo of your guesthouse address to hand.',
    fromPrice: 1900,
    bestSeason: 'Nov – Feb',
    tags: ['Spiritual', 'Ghats', 'Food'],
    temperature: '26°',
    tripCount: '1.6k trips',
  },
};

export const destinations: Record<DestinationSlug, Destination> = Object.fromEntries(
  (Object.entries(destinationData) as [DestinationSlug, DestinationLiteral][]).map(
    ([slug, data]) => [slug, { ...data, image: images.destinations[slug] }],
  ),
) as Record<DestinationSlug, Destination>;

export const destinationList: Destination[] = Object.values(destinations);

/** Filter pills on Home and Explore. */
export const destinationFilters = [
  { key: 'all', label: 'All' },
  { key: 'trending', label: 'Trending' },
  { key: 'safe', label: 'Solo safe' },
  { key: 'hidden', label: 'Hidden gems' },
  { key: 'budget', label: 'Under ₹3k' },
  { key: 'mountains', label: 'Mountains' },
  { key: 'beach', label: 'Beach' },
] as const;

export type DestinationFilterKey = (typeof destinationFilters)[number]['key'];

const hasTag = (destination: Destination, tag: string) =>
  destination.tags.some((t) => t.toLowerCase() === tag.toLowerCase());

/**
 * Client-side filtering over the demo set. Home and Explore share this so a pill
 * tapped on either screen means the same thing.
 */
export function filterDestinations(key: DestinationFilterKey): Destination[] {
  const all = destinationList;

  switch (key) {
    case 'all':
      return all;
    case 'trending':
      return [...all].sort((a, b) => b.tripCount.localeCompare(a.tripCount, undefined, { numeric: true }));
    case 'safe':
      return all.filter((d) => d.safetyLevel === 'safe');
    case 'hidden':
      return all.filter((d) => ['coorg', 'munnar', 'andaman'].includes(d.slug));
    case 'budget':
      return all.filter((d) => d.fromPrice < 3000);
    case 'mountains':
      return all.filter((d) => hasTag(d, 'Mountains') || hasTag(d, 'Hills') || hasTag(d, 'Trekking'));
    case 'beach':
      return all.filter((d) => hasTag(d, 'Beach') || hasTag(d, 'Islands'));
  }
}

/** Case-insensitive match across name, region, blurb and tags. */
export function searchDestinations(query: string): Destination[] {
  const q = query.trim().toLowerCase();
  if (!q) return destinationList;

  return destinationList.filter((d) =>
    [d.name, d.region, d.blurb, ...d.tags].some((field) =>
      field.toLowerCase().includes(q),
    ),
  );
}

/**
 * DEMO DATA.
 * Nothing here comes from the API. Used until the insights endpoints exist so the
 * Home layout can be finished visually without implying live data.
 */
export type InsightCard = {
  key: 'trending' | 'weather' | 'hiddenGem';
  eyebrow: string;
  title: string;
  detail: string;
  image: { uri: string };
  /** Destination this insight points at. */
  slug: DestinationSlug;
  icon: string;
};

export const insightCards: InsightCard[] = [
  {
    key: 'trending',
    eyebrow: 'Trending',
    title: 'Udaipur',
    detail: 'Most searched this week · 2.1k trips planned',
    image: { uri: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=80' },
    slug: 'udaipur',
    icon: 'trending-up',
  },
  {
    key: 'weather',
    eyebrow: 'Weather friendly',
    title: '22° and clear',
    detail: 'Great conditions for walking tours in Jaipur',
    image: { uri: 'https://images.unsplash.com/photo-1583537662660-b3b14156e275?w=600&q=80' },
    slug: 'jaipur',
    icon: 'partly-sunny-outline',
  },
  {
    key: 'hiddenGem',
    eyebrow: 'Hidden gem',
    title: 'Coorg',
    detail: 'Off-season favourite · quiet this week',
    image: { uri: 'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=600&q=80' },
    slug: 'coorg',
    icon: 'sparkles-outline',
  },
];

/** DEMO DATA. No weather API is wired up yet. */
export const currentWeather = {
  city: 'Bengaluru',
  temperature: 22,
  condition: 'Clear',
  high: 26,
  low: 17,
  icon: 'partly-sunny-outline',
} as const;