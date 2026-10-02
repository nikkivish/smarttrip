import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackground } from '@/components/ui/GradientSurface';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { SafetyBadge } from '@/components/ui/SafetyBadge';
import { useScreenTopInset } from '@/components/DesktopNav';
import { useTrips } from '@/hooks/useTrips';
import {
  contentColumn,
  useGridCellWidth,
  useHorizontalGutter,
  useIsWide,
} from '@/hooks/useResponsive';
import {
  colors,
  destinationList,
  fontSize,
  fontWeight,
  images,
  layout,
  radius,
  shadow,
  spacing,
  type,
} from '@/theme';
import type { Trip, TripStatus } from '@/types';

type Filter = 'all' | 'upcoming' | 'drafts' | 'past';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All trips' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'past', label: 'Past' },
];

const STATUS_LABEL: Record<TripStatus, string> = {
  draft: 'Draft',
  planning: 'Planning',
  confirmed: 'Confirmed',
  active: 'In progress',
  completed: 'Completed',
};

/** Falls back to a demo destination photo when a trip has no cover image. */
function coverFor(trip: Trip) {
  if (trip.coverImageUrl) return { uri: trip.coverImageUrl };
  const match = destinationList.find(
    (d) => trip.destination.toLowerCase().includes(d.name.toLowerCase()),
  );
  return match?.image ?? images.destinations.udaipur;
}

function dayCount(trip: Trip) {
  const start = new Date(trip.startDate).getTime();
  const end = new Date(trip.endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return Math.round((end - start) / 86_400_000) + 1;
}

function matches(trip: Trip, filter: Filter, now: number) {
  const end = new Date(trip.endDate).getTime();
  switch (filter) {
    case 'all':
      return true;
    case 'upcoming':
      return !Number.isNaN(end) ? end >= now : trip.status === 'draft';
    case 'drafts':
      return trip.status === 'draft' || trip.status === 'planning';
    case 'past':
      return !Number.isNaN(end) && end < now;
  }
}

export default function TripsScreen() {
  const router = useRouter();
  const { trips, isLoading, error, refresh } = useTrips();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const topInset = useScreenTopInset();
  const gutter = useHorizontalGutter();
  const isWide = useIsWide();
  // A phone keeps the stacked list it shipped with. A tablet or desktop pairs
  // trips two across instead of running one wide row per trip.
  const columns = isWide ? 2 : 1;
  const cellWidth = useGridCellWidth(columns);

  // The list changes on other screens (new trip, deleted trip), so re-read on focus.
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      void refresh();
    }, [refresh]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setNow(Date.now());
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const visible = useMemo(
    () => trips.filter((t) => matches(t, filter, now)),
    [filter, now, trips],
  );

  const counts = useMemo(
    () =>
      FILTERS.reduce(
        (acc, f) => ({ ...acc, [f.key]: trips.filter((t) => matches(t, f.key, now)).length }),
        {} as Record<Filter, number>,
      ),
    [now, trips],
  );

  return (
    <AppBackground>
      <View style={[styles.header, contentColumn, { paddingHorizontal: gutter, paddingTop: topInset }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>My Trips</Text>
            <Text style={styles.subtitle}>
              {trips.length === 0
                ? 'Plan something and it will show up here'
                : `${trips.length} ${trips.length === 1 ? 'trip' : 'trips'} in your account`}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/trip/new')}
            accessibilityRole="button"
            accessibilityLabel="Plan a new trip"
            style={({ pressed }) => [styles.newButton, shadow.pill, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={20} color={colors.onPrimary} />
          </Pressable>
        </View>

<ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRail}
          style={[styles.filters, { marginHorizontal: -gutter }]}
        >
          {FILTERS.map((f) => (
            <Pill
              key={f.key}
              label={f.label}
              selected={filter === f.key}
              count={counts[f.key]}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>
      </View>

<ScrollView
        showsVerticalScrollIndicator={false}
        style={contentColumn}
        contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : error ? (
          <View style={[styles.card, shadow.card]}>
            <Text style={styles.errorTitle}>Could not load your trips</Text>
            <Text style={styles.cardBody}>{error}</Text>
            <Button label="Try again" variant="outline" onPress={() => void refresh()} />
          </View>
        ) : trips.length === 0 ? (
          <EmptyState onPlan={() => router.push('/trip/new')} />
        ) : visible.length === 0 ? (
          <View style={[styles.card, shadow.card]}>
            <Text style={styles.cardTitle}>Nothing here yet</Text>
            <Text style={styles.cardBody}>
              No {FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} right now. Try
              another filter.
            </Text>
          </View>
        ) : (
<View style={[styles.list, isWide && styles.listGrid]}>
            {visible.map((trip) => (
              <View key={trip.id} style={isWide ? { width: cellWidth } : undefined}>
                <TripRow
                  trip={trip}
                  onPress={() => router.push(`/trip/${trip.id}`)}
                />
              </View>
            ))}
          </View>
        )}

        {trips.length > 0 ? (
          <Button
            label="Plan another trip"
            variant="outline"
            fullWidth
            onPress={() => router.push('/trip/new')}
            style={styles.bottomCta}
          />
        ) : null}
      </ScrollView>
    </AppBackground>
  );
}

/* ---------------------------------- parts ---------------------------------- */

function EmptyState({ onPlan }: { onPlan: () => void }) {
  return (
    <View style={[styles.empty, shadow.card]}>
      <View style={styles.emptyIcon}>
        <Ionicons name="map-outline" size={26} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>No trips yet</Text>
      <Text style={styles.emptyBody}>
        Tell us where and when. The planner builds a day-by-day route with safety notes for each
        stop.
      </Text>
      <Button label="Plan your first trip" onPress={onPlan} fullWidth />
    </View>
  );
}

function TripRow({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const days = dayCount(trip);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${trip.title}, ${STATUS_LABEL[trip.status]}`}
      style={({ pressed }) => [styles.row, shadow.card, pressed && styles.pressed]}
    >
      <Image
        source={coverFor(trip)}
        style={styles.rowImage}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowStatus}>{STATUS_LABEL[trip.status]}</Text>
          {trip.safetyLevel ? <SafetyBadge level={trip.safetyLevel} compact /> : null}
        </View>

        <Text style={styles.rowTitle} numberOfLines={1}>
          {trip.title}
        </Text>
        <Text style={styles.rowPlace} numberOfLines={1}>
          {trip.destination}
          {days > 0 ? ` · ${days} ${days === 1 ? 'day' : 'days'}` : ''}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

/* --------------------------------- styling --------------------------------- */

const styles = StyleSheet.create({
header: {
    gap: spacing.base,
    paddingBottom: spacing.base,
  },
  headerRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.base },
  headerText: { flex: 1, gap: 2 },
  title: {
    ...type.title,
    color: colors.text,
  },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.base },
  newButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
// The rail is pulled out to the page edge and aligned with the content.
  filters: { marginHorizontal: -layout.screenPadding },
  filterRail: { gap: spacing.sm },
  pressed: { opacity: 0.85 },

  content: { paddingBottom: spacing.xxl },
  list: { gap: layout.cardGap },
  // Wide screens wrap the rows into two columns.
  listGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  loader: { marginVertical: spacing.xxl },

  // State cards are prose, so they stay at a readable width on a desktop.
  card: {
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    maxWidth: layout.readableMaxWidth,
    padding: spacing.base,
    width: '100%',
  },
  cardTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  cardBody: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },
  errorTitle: { color: colors.danger, fontSize: fontSize.md, fontWeight: fontWeight.bold },

  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowImage: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, height: 64, width: 64 },
  rowBody: { flex: 1, gap: 2 },
  rowTop: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  rowStatus: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  rowTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  rowPlace: { color: colors.textMuted, fontSize: fontSize.sm },

empty: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.sm,
    maxWidth: layout.readableMaxWidth,
    padding: spacing.xl,
    width: '100%',
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  emptyTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  emptyBody: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },

  bottomCta: { alignSelf: 'center', marginTop: spacing.lg, maxWidth: layout.readableMaxWidth, width: '100%' },
});