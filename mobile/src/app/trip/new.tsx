import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import {
  contentColumn,
  useHorizontalGutter,
  useReadableColumn,
  useSideBySide,
} from '@/hooks/useResponsive';
import { ApiError, tripsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { colors, fontSize, spacing } from '@/theme';

/** `YYYY-MM-DD`, which is what the API coerces into a Date. */
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

const addDays = (d: Date, n: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
};

export default function NewTripScreen() {
  const router = useRouter();
  const { token } = useAuth();
  // Pre-fills when arriving from a destination card, e.g. "Plan this trip".
  const { destination: preset } = useLocalSearchParams<{ destination?: string }>();

  const gutter = useHorizontalGutter();
  const form = useReadableColumn();
  // Date and party fields pair up on a wide window instead of stacking.
  const pair = useSideBySide(220);
  const pairField = pair.direction === 'row' ? styles.pairField : undefined;

  const today = new Date();
  const [destination, setDestination] = useState(preset ?? '');
  const [startDate, setStartDate] = useState(isoDay(today));
  const [endDate, setEndDate] = useState(isoDay(addDays(today, 3)));
  const [travellers, setTravellers] = useState('1');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!token) return;
    setError(null);

    const count = Number(travellers);
    if (!Number.isInteger(count) || count < 1 || count > 20) {
      setError('Travellers must be a whole number between 1 and 20.');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after the start date.');
      return;
    }

    setBusy(true);
    try {
      const trip = await tripsApi.create(
        {
          destination: destination.trim(),
          startDate,
          endDate,
          travellers: count,
          budget: budget ? Number(budget) : undefined,
        },
        token,
      );
      router.replace(`/trip/${trip.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the trip.');
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = Boolean(token && destination.trim().length >= 2 && startDate && endDate);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Stack.Screen options={{ title: 'New trip' }} />
      <ScrollView
        style={contentColumn}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[form, { paddingHorizontal: gutter }]}>
          <Text style={styles.intro}>
            Tell us where you are going and we will build a day-by-day plan with safety notes.
          </Text>

          <TextField
            label="Destination"
            value={destination}
            onChangeText={setDestination}
            placeholder="e.g. Udaipur, Rajasthan"
            autoCapitalize="words"
          />
          <View style={{ flexDirection: pair.direction, gap: pair.gap }}>
            <TextField
              label="Start date"
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              style={pairField}
            />
            <TextField
              label="End date"
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              style={pairField}
            />
          </View>
          <View style={{ flexDirection: pair.direction, gap: pair.gap }}>
            <TextField
              label="Travellers"
              value={travellers}
              onChangeText={setTravellers}
              keyboardType="number-pad"
              style={pairField}
            />
            <TextField
              label="Budget (optional)"
              value={budget}
              onChangeText={setBudget}
              keyboardType="decimal-pad"
              style={pairField}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button
              label="Create trip"
              onPress={onSubmit}
              loading={busy}
              disabled={!canSubmit}
              fullWidth
            />
            <Button label="Cancel" variant="ghost" onPress={() => router.back()} fullWidth />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.lg,
  },
  pairField: { flex: 1 },
  intro: { color: colors.textSecondary, fontSize: fontSize.sm },
  actions: { gap: spacing.sm, marginTop: spacing.base },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
