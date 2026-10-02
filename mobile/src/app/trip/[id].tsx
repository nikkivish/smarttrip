import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SafetyBadge } from '@/components/ui/SafetyBadge';
import { useTripDetail } from '@/hooks/useTrips';
import {
  contentColumn,
  useHorizontalGutter,
  useSideBySide,
} from '@/hooks/useResponsive';
import { useAuth } from '@/lib/auth-context';
import { tripsApi } from '@/lib/api';
import { useState } from 'react';
import { colors, fontSize, fontWeight, layout, spacing } from '@/theme';

const categoryIcon: Record<string, string> = {
  transport: '🚐',
  stay: '🏨',
  food: '🍽',
  activity: '🎟',
  shopping: '🛍',
};

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { trip, isLoading, error, refresh } = useTripDetail(id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const gutter = useHorizontalGutter();
  // Wide screens put the actions beside the itinerary; a phone keeps the
  // original top-to-bottom order.
  const split = useSideBySide(360);

  const onGenerate = async () => {
    if (!id || !token) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      await tripsApi.generate(id, token);
      // Generation writes the itinerary server-side, so refetch to show it.
      await refresh();
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Could not generate the itinerary');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !trip) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.content}>
          <Text style={styles.error}>{error ?? 'Trip not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Stack.Screen options={{ title: trip.destination }} />
      <ScrollView
        style={contentColumn}
        contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>{trip.title}</Text>
          <Text style={styles.destination}>{trip.destination}</Text>
          {trip.safetyLevel ? (
            <View style={styles.heroBadge}>
              <SafetyBadge
                level={trip.safetyLevel}
                label={
                  trip.safetyScore != null
                    ? `Safety ${trip.safetyScore}/100`
                    : undefined
                }
              />
            </View>
          ) : null}
        </View>

        {trip.summary ? <Text style={styles.summary}>{trip.summary}</Text> : null}

        <View style={{ flexDirection: split.direction, gap: split.gap }}>
          <View style={styles.pane}>
            {trip.itinerary.length === 0 ? (
              <Card style={styles.card}>
                <Text style={styles.cardTitle}>No itinerary yet</Text>
                <Text style={styles.cardBody}>
                  Generate a day-by-day plan built around well-lit areas and verified stays.
                </Text>
                <Button
                  label="Generate with AI"
                  onPress={onGenerate}
                  loading={isGenerating}
                  fullWidth
                  style={styles.generateButton}
                />
                {generateError ? <Text style={styles.error}>{generateError}</Text> : null}
              </Card>
            ) : (
              trip.itinerary.map((day) => (
                <View key={day.day} style={styles.day}>
                  <Text style={styles.dayTitle}>
                    Day {day.day} · {day.title}
                  </Text>

                  {day.items.map((item) => (
                    <Card key={item.id} style={styles.item}>
                      <Text style={styles.itemTime}>{item.time}</Text>
                      <View style={styles.itemBody}>
                        <Text style={styles.itemTitle}>
                          {categoryIcon[item.category] ?? '•'} {item.title}
                        </Text>
                        {item.placeLabel ? (
                          <Text style={styles.itemPlace}>{item.placeLabel}</Text>
                        ) : null}
                        {item.description ? (
                          <Text style={styles.itemDescription}>{item.description}</Text>
                        ) : null}
                        {item.safetyLevel ? (
                          <View style={styles.itemBadge}>
                            <SafetyBadge level={item.safetyLevel} compact />
                          </View>
                        ) : null}
                      </View>
                    </Card>
                  ))}
                </View>
              ))
            )}
          </View>

          <View style={styles.pane}>
            <Button
              label="Regenerate itinerary"
              variant="outline"
              onPress={onGenerate}
              loading={isGenerating}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  content: { gap: spacing.md, paddingBottom: spacing.xxxl, paddingTop: spacing.lg },
  // Each column of the wide-screen split: the itinerary and the actions.
  pane: { flex: 1, gap: spacing.md },
  hero: { gap: 4, maxWidth: layout.readableMaxWidth },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  destination: { color: colors.textSecondary, fontSize: fontSize.base },
  heroBadge: { marginTop: spacing.sm },
  summary: { color: colors.textSecondary, fontSize: fontSize.sm },
  card: { gap: 4 },
  cardTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  cardBody: { color: colors.textSecondary, fontSize: fontSize.sm },
  generateButton: { marginTop: spacing.md },
  day: { gap: spacing.sm, marginTop: spacing.md },
  dayTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  item: { flexDirection: 'row', gap: spacing.md },
  itemTime: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, width: 48 },
  itemBody: { flex: 1, gap: 4 },
  itemTitle: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  itemPlace: { color: colors.textMuted, fontSize: fontSize.xs },
  itemDescription: { color: colors.textSecondary, fontSize: fontSize.sm },
  itemBadge: { flexDirection: 'row', marginTop: 2 },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
