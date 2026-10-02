import { useCallback, useEffect, useState } from 'react';

import { tripsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { mapTrip, mapTripWithItinerary } from '@/lib/mappers';
import type { Trip } from '@/types';

type State = {
  trips: Trip[];
  isLoading: boolean;
  error: string | null;
};

export function useTrips() {
  const { token } = useAuth();
  const [state, setState] = useState<State>({ trips: [], isLoading: true, error: null });

  // Called from event handlers (pull to refresh, after create) where an immediate
  // loading state is expected.
  const refresh = useCallback(async () => {
    if (!token) {
      setState({ trips: [], isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await tripsApi.list(token);
      setState({ trips: data.map(mapTrip), isLoading: false, error: null });
    } catch (err) {
      setState({
        trips: [],
        isLoading: false,
        error: err instanceof Error ? err.message : 'Could not load your trips',
      });
    }
  }, [token]);

  // Initial load. State is only written after the await, so there is no
  // synchronous setState inside the effect.
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    void (async () => {
      try {
        const data = await tripsApi.list(token);
        if (!cancelled) setState({ trips: data.map(mapTrip), isLoading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        setState({
          trips: [],
          isLoading: false,
          error: err instanceof Error ? err.message : 'Could not load your trips',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // Signed out: derive the empty state instead of writing to it in an effect.
  return token ? { ...state, refresh } : { trips: [], isLoading: false, error: null, refresh };
}

export function useTripDetail(id: string | undefined) {
  const { token } = useAuth();
  const [trip, setTrip] = useState<ReturnType<typeof mapTripWithItinerary> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token || !id) return;
    setIsLoading(true);
    setError(null);
    try {
      setTrip(mapTripWithItinerary(await tripsApi.get(id, token)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this trip');
    } finally {
      setIsLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (!token || !id) return;

    let cancelled = false;
    void (async () => {
      try {
        const data = mapTripWithItinerary(await tripsApi.get(id, token));
        if (!cancelled) {
          setTrip(data);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not load this trip');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, token]);

  return { trip, isLoading, error, refresh };
}
