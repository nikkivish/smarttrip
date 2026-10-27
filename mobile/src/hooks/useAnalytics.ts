import { useCallback, useEffect, useState } from 'react';

import { analyticsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AnalyticsResponse } from '@/types';

type AnalyticsState = {
  data: AnalyticsResponse | null;
  isLoading: boolean;
  error: string | null;
  source: 'live' | 'demo';
};

const DEMO_ANALYTICS: AnalyticsResponse = {
  meta: { scope: 'user', generatedAt: new Date().toISOString(), currencies: ['INR'] },
  kpis: {
    totalUsers: 1,
    totalTrips: 5,
    itineraryDays: 22,
    itineraryItems: 48,
    totalAlerts: 6,
    averageTripBudget: 38000,
    averageTripDuration: 5.2,
    averageSafetyScore: 84,
    totalTravellers: 9,
    totalPlannedCost: 146200,
    alertAcknowledgementRate: 83.33,
  },
  destinations: [
    { destination: 'Alleppey, Kerala', tripCount: 2, totalBudget: 72000, averageBudget: 36000, averageTripDuration: 5, averageSafetyScore: 88, totalTravellers: 4 },
    { destination: 'Jaipur, Rajasthan', tripCount: 1, totalBudget: 32000, averageBudget: 32000, averageTripDuration: 4, averageSafetyScore: 82, totalTravellers: 2 },
    { destination: 'Goa', tripCount: 1, totalBudget: 46000, averageBudget: 46000, averageTripDuration: 6, averageSafetyScore: 79, totalTravellers: 2 },
    { destination: 'Manali, Himachal Pradesh', tripCount: 1, totalBudget: 40000, averageBudget: 40000, averageTripDuration: 6, averageSafetyScore: 87, totalTravellers: 1 },
  ],
  costByCategory: [
    { category: 'stay', itemCount: 12, totalCost: 52000, costSharePercentage: 35.57 },
    { category: 'food', itemCount: 11, totalCost: 31800, costSharePercentage: 21.75 },
    { category: 'transport', itemCount: 9, totalCost: 28600, costSharePercentage: 19.56 },
    { category: 'activity', itemCount: 10, totalCost: 23800, costSharePercentage: 16.28 },
    { category: 'shopping', itemCount: 6, totalCost: 10000, costSharePercentage: 6.84 },
  ],
  budgetAnalysis: [
    { tripId: 'demo-1', title: 'Kerala backwaters', destination: 'Alleppey, Kerala', currency: 'INR', budget: 42000, plannedCost: 39800, remainingBudget: 2200, utilizationPercentage: 94.76, isOverBudget: false },
    { tripId: 'demo-2', title: 'Royal Rajasthan escape', destination: 'Jaipur, Rajasthan', currency: 'INR', budget: 32000, plannedCost: 34800, remainingBudget: -2800, utilizationPercentage: 108.75, isOverBudget: true },
    { tripId: 'demo-3', title: 'Goa coastal weekend', destination: 'Goa', currency: 'INR', budget: 46000, plannedCost: 36100, remainingBudget: 9900, utilizationPercentage: 78.48, isOverBudget: false },
    { tripId: 'demo-4', title: 'Himalayan retreat', destination: 'Manali, Himachal Pradesh', currency: 'INR', budget: 40000, plannedCost: 35500, remainingBudget: 4500, utilizationPercentage: 88.75, isOverBudget: false },
  ],
  safety: {
    totalAlerts: 6,
    sosAlerts: 1,
    checkInAlerts: 2,
    areaRiskAlerts: 3,
    contactAlerts: 0,
    infoAlerts: 3,
    warningAlerts: 2,
    criticalAlerts: 1,
    acknowledged: 5,
    unacknowledged: 1,
    acknowledgementRate: 83.33,
    totalCheckIns: 8,
    byType: [
      { type: 'AREA_RISK', count: 3 },
      { type: 'CHECK_IN', count: 2 },
      { type: 'SOS', count: 1 },
      { type: 'CONTACT', count: 0 },
    ],
    bySeverity: [
      { severity: 'INFO', count: 3 },
      { severity: 'WARNING', count: 2 },
      { severity: 'CRITICAL', count: 1 },
    ],
  },
  insights: [
    { id: 'demo-popular-destination', level: 'info', message: 'Alleppey, Kerala is the most planned destination, with 2 trips.' },
    { id: 'demo-cost-category', level: 'info', message: 'Stay is the highest-cost itinerary category at 35.57% of planned spend.' },
    { id: 'demo-over-budget', level: 'warning', message: 'Royal Rajasthan escape is over budget by INR 2,800.' },
    { id: 'demo-safety', level: 'success', message: '5 of 6 alerts have been acknowledged, and 8 check-ins were recorded.' },
  ],
};

function hasAnalyticsData(data: AnalyticsResponse | null) {
  return Boolean(data && (data.kpis.totalTrips > 0 || data.safety.totalAlerts > 0));
}

export function useAnalytics() {
  const { token } = useAuth();
  const [state, setState] = useState<AnalyticsState>({
    data: null,
    isLoading: true,
    error: null,
    source: 'demo',
  });

  const refresh = useCallback(async () => {
    if (!token) {
      setState({ data: DEMO_ANALYTICS, isLoading: false, error: null, source: 'demo' });
      return;
    }

    setState((previous) => ({ ...previous, isLoading: true, error: null }));
    try {
      const data = await analyticsApi.get(token);
      setState(hasAnalyticsData(data)
        ? { data, isLoading: false, error: null, source: 'live' }
        : { data: DEMO_ANALYTICS, isLoading: false, error: null, source: 'demo' });
    } catch (error) {
      setState({
        data: DEMO_ANALYTICS,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Could not load analytics',
        source: 'demo',
      });
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    void (async () => {
      try {
        const data = await analyticsApi.get(token);
        if (!cancelled) {
          setState(hasAnalyticsData(data)
            ? { data, isLoading: false, error: null, source: 'live' }
            : { data: DEMO_ANALYTICS, isLoading: false, error: null, source: 'demo' });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: DEMO_ANALYTICS,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Could not load analytics',
            source: 'demo',
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return token
    ? { ...state, refresh }
    : { ...state, data: DEMO_ANALYTICS, isLoading: false, error: null, source: 'demo' as const, refresh };
}
