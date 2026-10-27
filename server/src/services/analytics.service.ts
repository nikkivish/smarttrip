import { prisma } from '../db';
import { AlertSeverity, AlertType } from '../generated/prisma/enums';

const MS_PER_DAY = 86_400_000;

/**
 * Scope of an analytics run. The current auth model has no admin role, so the
 * route always passes a `userId`. Omitting it computes application-wide numbers;
 * that is only safe to expose once a role check exists.
 */
export type AnalyticsScope = { userId?: string };

// --- Raw rows (what the database queries return) ---

export type TripRow = {
  id: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  travellers: number;
  budget: number | null;
  currency: string;
  safetyScore: number | null;
};

/** One row per (day, category) with its item count and summed non-null cost. */
export type ItemGroupRow = {
  dayId: string;
  category: string;
  itemCount: number;
  totalCost: number;
};

export type AlertGroupRow = {
  type: AlertType;
  severity: AlertSeverity;
  acknowledged: boolean;
  count: number;
};

export type AnalyticsInput = {
  scope: 'user' | 'global';
  totalUsers: number;
  trips: TripRow[];
  days: { id: string; tripId: string }[];
  itemGroups: ItemGroupRow[];
  alertGroups: AlertGroupRow[];
  totalCheckIns: number;
};

// --- Response ---

export type Insight = {
  id: string;
  level: 'info' | 'success' | 'warning';
  message: string;
};

export type AnalyticsResponse = {
  meta: {
    scope: 'user' | 'global';
    generatedAt: string;
    currencies: string[];
  };
  kpis: {
    totalUsers: number;
    totalTrips: number;
    itineraryDays: number;
    itineraryItems: number;
    totalAlerts: number;
    averageTripBudget: number;
    averageTripDuration: number;
    averageSafetyScore: number;
    totalTravellers: number;
    totalPlannedCost: number;
    alertAcknowledgementRate: number;
  };
  destinations: {
    destination: string;
    tripCount: number;
    totalBudget: number;
    averageBudget: number | null;
    averageTripDuration: number;
    averageSafetyScore: number | null;
    totalTravellers: number;
  }[];
  costByCategory: {
    category: string;
    itemCount: number;
    totalCost: number;
    costSharePercentage: number;
  }[];
  budgetAnalysis: {
    tripId: string;
    title: string;
    destination: string;
    currency: string;
    budget: number;
    plannedCost: number;
    remainingBudget: number;
    /** null when the budget is 0, because a percentage of zero is undefined. */
    utilizationPercentage: number | null;
    isOverBudget: boolean;
  }[];
  safety: {
    totalAlerts: number;
    sosAlerts: number;
    checkInAlerts: number;
    areaRiskAlerts: number;
    contactAlerts: number;
    infoAlerts: number;
    warningAlerts: number;
    criticalAlerts: number;
    acknowledged: number;
    unacknowledged: number;
    acknowledgementRate: number;
    totalCheckIns: number;
    byType: { type: AlertType; count: number }[];
    bySeverity: { severity: AlertSeverity; count: number }[];
  };
  insights: Insight[];
};

// --- Helpers ---

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** Mean of the values, or null when there is nothing to average. */
function mean(values: number[]): number | null {
  return values.length === 0 ? null : sum(values) / values.length;
}

function percent(part: number, whole: number): number {
  return whole > 0 ? round2((part / whole) * 100) : 0;
}

/** Whole days between start and end (a 1 → 4 June trip is 3). */
function durationDays(trip: Pick<TripRow, 'startDate' | 'endDate'>): number {
  return Math.max(0, Math.round((trip.endDate.getTime() - trip.startDate.getTime()) / MS_PER_DAY));
}

function formatMoney(value: number): string {
  return Math.round(value).toLocaleString('en-IN');
}

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

// --- Pure computation (no I/O, so it can be tested without a database) ---

export function computeAnalytics(input: AnalyticsInput): AnalyticsResponse {
  const { trips, days, itemGroups, alertGroups } = input;

  // Planned cost per trip, via day -> trip.
  const tripByDay = new Map(days.map((day) => [day.id, day.tripId]));
  const plannedByTrip = new Map<string, number>();
  const categories = new Map<string, { itemCount: number; totalCost: number }>();

  for (const group of itemGroups) {
    const tripId = tripByDay.get(group.dayId);
    if (tripId) plannedByTrip.set(tripId, (plannedByTrip.get(tripId) ?? 0) + group.totalCost);

    const entry = categories.get(group.category) ?? { itemCount: 0, totalCost: 0 };
    entry.itemCount += group.itemCount;
    entry.totalCost += group.totalCost;
    categories.set(group.category, entry);
  }

  const itineraryItems = sum(itemGroups.map((g) => g.itemCount));
  const totalPlannedCost = sum([...categories.values()].map((c) => c.totalCost));

  // --- Trips ---
  const budgets = trips.flatMap((t) => (t.budget === null ? [] : [t.budget]));
  const scores = trips.flatMap((t) => (t.safetyScore === null ? [] : [t.safetyScore]));
  const durations = trips.map(durationDays);

  // --- Destinations (case/whitespace-insensitive grouping) ---
  const destinationGroups = new Map<string, TripRow[]>();
  for (const trip of trips) {
    const key = trip.destination.trim().toLowerCase();
    const bucket = destinationGroups.get(key);
    if (bucket) bucket.push(trip);
    else destinationGroups.set(key, [trip]);
  }

  const destinations: AnalyticsResponse['destinations'] = [...destinationGroups.values()]
    .map((group) => {
      const groupBudgets = group.flatMap((t) => (t.budget === null ? [] : [t.budget]));
      const groupScores = group.flatMap((t) => (t.safetyScore === null ? [] : [t.safetyScore]));
      const avgBudget = mean(groupBudgets);
      const avgScore = mean(groupScores);
      return {
        destination: (group[0]?.destination ?? '').trim(),
        tripCount: group.length,
        totalBudget: round2(sum(groupBudgets)),
        averageBudget: avgBudget === null ? null : round2(avgBudget),
        averageTripDuration: round2(mean(group.map(durationDays)) ?? 0),
        averageSafetyScore: avgScore === null ? null : round2(avgScore),
        totalTravellers: sum(group.map((t) => t.travellers)),
      };
    })
    .sort((a, b) => b.tripCount - a.tripCount || a.destination.localeCompare(b.destination));

  // --- Cost by category (uses the categories actually stored) ---
  const costByCategory: AnalyticsResponse['costByCategory'] = [...categories.entries()]
    .map(([category, entry]) => ({
      category,
      itemCount: entry.itemCount,
      totalCost: round2(entry.totalCost),
      costSharePercentage: percent(entry.totalCost, totalPlannedCost),
    }))
    .sort((a, b) => b.totalCost - a.totalCost || a.category.localeCompare(b.category));

  // --- Budget vs planned cost ---
  const budgetAnalysis: AnalyticsResponse['budgetAnalysis'] = trips
    .flatMap((trip) => {
      if (trip.budget === null) return [];
      const plannedCost = plannedByTrip.get(trip.id) ?? 0;
      return [
        {
          tripId: trip.id,
          title: trip.title,
          destination: trip.destination,
          currency: trip.currency,
          budget: round2(trip.budget),
          plannedCost: round2(plannedCost),
          remainingBudget: round2(trip.budget - plannedCost),
          utilizationPercentage: trip.budget > 0 ? round2((plannedCost / trip.budget) * 100) : null,
          isOverBudget: plannedCost > trip.budget,
        },
      ];
    })
    // Most overspent first, so over-budget trips lead the list.
    .sort((a, b) => a.remainingBudget - b.remainingBudget);

  // --- Safety ---
  const countBy = <K extends string>(key: (g: AlertGroupRow) => K, value: K): number =>
    sum(alertGroups.filter((g) => key(g) === value).map((g) => g.count));

  const totalAlerts = sum(alertGroups.map((g) => g.count));
  const acknowledged = sum(alertGroups.filter((g) => g.acknowledged).map((g) => g.count));

  const byType = (Object.values(AlertType) as AlertType[]).map((type) => ({
    type,
    count: countBy((g) => g.type, type),
  }));
  const bySeverity = (Object.values(AlertSeverity) as AlertSeverity[]).map((severity) => ({
    severity,
    count: countBy((g) => g.severity, severity),
  }));
  const typeCount = (type: AlertType) => byType.find((t) => t.type === type)?.count ?? 0;
  const severityCount = (severity: AlertSeverity) =>
    bySeverity.find((s) => s.severity === severity)?.count ?? 0;

  const acknowledgementRate = percent(acknowledged, totalAlerts);

  const currencies = [...new Set(trips.map((t) => t.currency))].sort();

  const response: AnalyticsResponse = {
    meta: { scope: input.scope, generatedAt: new Date().toISOString(), currencies },
    kpis: {
      totalUsers: input.totalUsers,
      totalTrips: trips.length,
      itineraryDays: days.length,
      itineraryItems,
      totalAlerts,
      averageTripBudget: round2(mean(budgets) ?? 0),
      averageTripDuration: round2(mean(durations) ?? 0),
      averageSafetyScore: round2(mean(scores) ?? 0),
      totalTravellers: sum(trips.map((t) => t.travellers)),
      totalPlannedCost: round2(totalPlannedCost),
      alertAcknowledgementRate: acknowledgementRate,
    },
    destinations,
    costByCategory,
    budgetAnalysis,
    safety: {
      totalAlerts,
      sosAlerts: typeCount('SOS'),
      checkInAlerts: typeCount('CHECK_IN'),
      areaRiskAlerts: typeCount('AREA_RISK'),
      contactAlerts: typeCount('CONTACT'),
      infoAlerts: severityCount('INFO'),
      warningAlerts: severityCount('WARNING'),
      criticalAlerts: severityCount('CRITICAL'),
      acknowledged,
      unacknowledged: totalAlerts - acknowledged,
      acknowledgementRate,
      totalCheckIns: input.totalCheckIns,
      byType,
      bySeverity,
    },
    insights: [],
  };

  response.insights = buildInsights(response, trips.length);
  return response;
}

// --- Insights ---

function buildInsights(data: AnalyticsResponse, tripCount: number): Insight[] {
  const insights: Insight[] = [];
  const { destinations, costByCategory, budgetAnalysis, safety, kpis } = data;

  if (tripCount === 0 && safety.totalAlerts === 0) {
    return [
      {
        id: 'no-data',
        level: 'info',
        message: 'No trips or alerts recorded yet. Plan a trip to start seeing insights here.',
      },
    ];
  }

  // Most popular destination.
  const top = destinations[0];
  if (top) {
    const tied = destinations.filter((d) => d.tripCount === top.tripCount);
    insights.push({
      id: 'popular-destination',
      level: 'info',
      message:
        tied.length > 1
          ? `${tied.map((d) => d.destination).join(', ')} are tied as the most planned destinations with ${plural(top.tripCount, 'trip')} each.`
          : `${top.destination} is the most planned destination with ${plural(top.tripCount, 'trip')}.`,
    });
  }

  // Highest-cost category.
  const topCategory = costByCategory[0];
  if (topCategory && topCategory.totalCost > 0) {
    insights.push({
      id: 'top-cost-category',
      level: 'info',
      message: `${topCategory.category} is the highest-cost itinerary category at ${topCategory.costSharePercentage}% of planned spend.`,
    });
  }

  // Budget utilization (mean of per-trip percentages, so mixed currencies don't matter).
  const utilizations = budgetAnalysis.flatMap((b) =>
    b.utilizationPercentage === null ? [] : [b.utilizationPercentage],
  );
  const avgUtilization = mean(utilizations);
  if (avgUtilization !== null) {
    insights.push({
      id: 'budget-utilization',
      level: 'info',
      message: `Across ${plural(utilizations.length, 'trip')} with a budget, itineraries use ${round2(avgUtilization)}% of budget on average.`,
    });
  }

  // Over-budget trips.
  const overBudget = budgetAnalysis.filter((b) => b.isOverBudget);
  if (overBudget.length > 0) {
    const names = overBudget
      .slice(0, 3)
      .map((b) => `${b.title} (over by ${b.currency} ${formatMoney(b.plannedCost - b.budget)})`)
      .join(', ');
    const more = overBudget.length > 3 ? `, and ${overBudget.length - 3} more` : '';
    insights.push({
      id: 'over-budget',
      level: 'warning',
      message: `${plural(overBudget.length, 'trip')} ${overBudget.length === 1 ? 'is' : 'are'} over budget: ${names}${more}.`,
    });
  } else if (budgetAnalysis.length > 0) {
    insights.push({
      id: 'over-budget',
      level: 'success',
      message: 'No trips are over budget.',
    });
  }

  // Mixed currencies make summed money totals approximate.
  if (data.meta.currencies.length > 1) {
    insights.push({
      id: 'mixed-currencies',
      level: 'warning',
      message: `Trips use ${data.meta.currencies.join(', ')}. Money totals add amounts across currencies without converting them.`,
    });
  }

  // Most common alert severity.
  if (safety.totalAlerts > 0) {
    const max = Math.max(...safety.bySeverity.map((s) => s.count));
    const leaders = safety.bySeverity.filter((s) => s.count === max);
    insights.push({
      id: 'common-severity',
      level: 'info',
      message: `${leaders.map((s) => s.severity).join(' and ')} ${leaders.length > 1 ? 'are the most common alert severities' : 'is the most common alert severity'} (${plural(max, 'alert')} of ${safety.totalAlerts}).`,
    });

    if (safety.unacknowledged > 0) {
      insights.push({
        id: 'unacknowledged-alerts',
        level: 'warning',
        message: `${plural(safety.unacknowledged, 'alert')} ${safety.unacknowledged === 1 ? 'has' : 'have'} not been acknowledged (${safety.acknowledgementRate}% acknowledged).`,
      });
    }
  }

  // SOS alerts.
  insights.push(
    safety.sosAlerts > 0
      ? {
          id: 'sos-alerts',
          level: 'warning',
          message: `${plural(safety.sosAlerts, 'SOS alert')} recorded.`,
        }
      : { id: 'sos-alerts', level: 'success', message: 'No SOS alerts recorded.' },
  );

  // Safety score observations.
  const scored = destinations.flatMap((d) =>
    d.averageSafetyScore === null ? [] : [{ ...d, score: d.averageSafetyScore }],
  );
  if (scored.length > 0) {
    const lowest = scored.reduce((a, b) => (b.score < a.score ? b : a));
    const highest = scored.reduce((a, b) => (b.score > a.score ? b : a));
    insights.push({
      id: 'safety-scores',
      level: 'info',
      message:
        scored.length > 1
          ? `Average safety score is ${kpis.averageSafetyScore}/100. ${highest.destination} scores highest (${highest.score}) and ${lowest.destination} lowest (${lowest.score}).`
          : `Average safety score is ${kpis.averageSafetyScore}/100 for ${lowest.destination}.`,
    });
  }
  const unscored = tripCount - scored.reduce((n, d) => n + d.tripCount, 0);
  if (unscored > 0) {
    insights.push({
      id: 'unscored-trips',
      level: 'info',
      message: `${plural(unscored, 'trip')} ${unscored === 1 ? 'has' : 'have'} no safety score yet; generate an itinerary to get one.`,
    });
  }

  return insights;
}

// --- Database access ---

/**
 * Loads the raw rows with one query per table (five in total) and delegates all
 * maths to `computeAnalytics`. Aggregation of alerts and itinerary items happens
 * in the database, so row volume stays proportional to categories/types rather
 * than to the number of records.
 */
export async function getAnalytics(scope: AnalyticsScope = {}): Promise<AnalyticsResponse> {
  const { userId } = scope;

  const tripWhere = userId ? { userId } : {};
  const dayWhere = userId ? { trip: { userId } } : {};
  const itemWhere = userId ? { day: { trip: { userId } } } : {};
  const ownerWhere = userId ? { userId } : {};

  const [trips, days, itemGroups, alertGroups, totalCheckIns, userCount] = await Promise.all([
    prisma.trip.findMany({
      where: tripWhere,
      select: {
        id: true,
        title: true,
        destination: true,
        startDate: true,
        endDate: true,
        travellers: true,
        budget: true,
        currency: true,
        safetyScore: true,
      },
    }),
    prisma.itineraryDay.findMany({ where: dayWhere, select: { id: true, tripId: true } }),
    prisma.itineraryItem.groupBy({
      by: ['dayId', 'category'],
      where: itemWhere,
      _count: { _all: true },
      _sum: { cost: true },
    }),
    prisma.alert.groupBy({
      by: ['type', 'severity', 'acknowledged'],
      where: ownerWhere,
      _count: { _all: true },
    }),
    prisma.checkIn.count({ where: ownerWhere }),
    // A user-scoped run is about one person; only count users for global runs.
    userId ? Promise.resolve(1) : prisma.user.count(),
  ]);

  return computeAnalytics({
    scope: userId ? 'user' : 'global',
    totalUsers: userCount,
    trips,
    days,
    itemGroups: itemGroups.map((g) => ({
      dayId: g.dayId,
      category: g.category,
      itemCount: g._count._all,
      totalCost: g._sum.cost ?? 0,
    })),
    alertGroups: alertGroups.map((g) => ({
      type: g.type,
      severity: g.severity,
      acknowledged: g.acknowledged,
      count: g._count._all,
    })),
    totalCheckIns,
  });
}
