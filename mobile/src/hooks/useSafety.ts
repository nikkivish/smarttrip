import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

import { safetyApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { mapAlertList } from '@/lib/mappers';
import type { Coordinates, SafetyAlert } from '@/types';

type LocationState = {
  coords: Coordinates | null;
  permission: 'granted' | 'denied' | 'undetermined';
  isLocating: boolean;
  error: string | null;
};

export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({
    coords: null,
    permission: 'undetermined',
    isLocating: false,
    error: null,
  });

  const locate = useCallback(async () => {
    setState((prev) => ({ ...prev, isLocating: true, error: null }));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState((prev) => ({
          ...prev,
          isLocating: false,
          permission: 'denied',
          error: 'Location permission is needed to share your location.',
        }));
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setState({ coords, permission: 'granted', isLocating: false, error: null });
      return coords;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLocating: false,
        error: err instanceof Error ? err.message : 'Could not get your location',
      }));
      return null;
    }
  }, []);

  return { ...state, locate };
}

export function useSafetyAlerts() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    void (async () => {
      try {
        const data = mapAlertList(await safetyApi.alerts(token));
        if (!cancelled) {
          setAlerts(data);
          setError(null);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not load alerts');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const acknowledge = useCallback(
    async (id: string) => {
      if (!token) return;
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
      try {
        await safetyApi.acknowledge(id, token);
      } catch {
        setAlerts(await safetyApi.alerts(token).then(mapAlertList));
      }
    },
    [token],
  );

  return { alerts, isLoading, error, acknowledge };
}
