import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBackground } from '@/components/ui/GradientSurface';
import { Pill } from '@/components/ui/Pill';
import { SafetyBadge } from '@/components/ui/SafetyBadge';
import { SearchBar } from '@/components/ui/SearchBar';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useScreenTopInset } from '@/components/DesktopNav';
import {
  contentColumn,
  useGridCellWidth,
  useGridColumns,
  useHorizontalGutter,
} from '@/hooks/useResponsive';
import {
  colors,
  destinationFilters,
  filterDestinations,
  fontSize,
  fontWeight,
  layout,
  radius,
  searchDestinations,
  shadow,
  spacing,
  type,
} from '@/theme';
import type { Destination, DestinationFilterKey } from '@/theme/navigation';

/**
 * Explore. DEMO DATA: the destination set lives in `theme/navigation`; filters
 * and search run on-device until a destinations endpoint exists.
 */
export default function ExploreScreen() {
  const router = useRouter();
  const { q: initialQuery, f: initialFilter } = useLocalSearchParams<{
    q?: string;
    f?: string;
  }>();

  const topInset = useScreenTopInset();
  const gutter = useHorizontalGutter();
  // The tiles carry an image plus four lines of copy, so they go from two
  // columns on a phone to three once a tablet or desktop can hold them.
  const columns = useGridColumns(3);
  const cellWidth = useGridCellWidth(columns);

  const [query, setQuery] = useState(initialQuery ?? '');
  const [filter, setFilter] = useState<DestinationFilterKey>(
    destinationFilters.some((f) => f.key === initialFilter)
      ? (initialFilter as DestinationFilterKey)
      : 'all',
  );

  const results = useMemo(() => {
    const base = filterDestinations(filter);
    if (!query.trim()) return base;
    const allowed = new Set(base.map((d) => d.slug));
    return searchDestinations(query).filter((d) => allowed.has(d.slug));
  }, [filter, query]);

  const sorted = useMemo(
    () => [...results].sort((a, b) => b.rating - a.rating),
    [results],
  );

  return (
    <AppBackground>
      <View style={[styles.header, contentColumn, { paddingHorizontal: gutter, paddingTop: topInset }]}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>
          Curated destinations for solo travellers, ranked by safety and season.
        </Text>

        <View style={styles.search}>
          <SearchBar
            placeholder="Search by city, region or vibe"
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

<ScrollView
        showsVerticalScrollIndicator={false}
        style={contentColumn}
        contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
        >
          {destinationFilters.map((f) => (
            <Pill
              key={f.key}
              label={f.label}
              selected={filter === f.key}
              count={filterDestinations(f.key).length}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>

<View style={styles.section}>
          <SectionHeading
            title={query.trim() ? `Results for “${query.trim()}”` : 'Popular right now'}
            subtitle={`${sorted.length} ${sorted.length === 1 ? 'destination' : 'destinations'}`}
          />

          {sorted.length === 0 ? (
            <View style={[styles.empty, shadow.card]}>
              <Ionicons name="search-outline" size={24} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No matches</Text>
              <Text style={styles.emptyBody}>
                Try another spelling, or clear the filter to see all eight.
              </Text>
              <Pressable
                onPress={() => {
                  setQuery('');
                  setFilter('all');
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
              >
                <Text style={styles.resetText}>Clear search and filters</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.grid}>
              {sorted.map((d) => (
                <View key={d.slug} style={{ width: cellWidth }}>
                  <ExploreTile
                    destination={d}
                    onPress={() => router.push(`/destination/${d.slug}`)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </AppBackground>
  );
}

function ExploreTile({ destination, onPress }: { destination: Destination; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${destination.name}, ${destination.region}. Rated ${destination.rating} out of 5.`}
      style={({ pressed }) => [styles.tile, shadow.card, pressed && styles.pressed]}
    >
      <Image
        source={destination.image}
        style={styles.tileImage}
        contentFit="cover"
        transition={280}
        cachePolicy="memory-disk"
      />
      <View style={styles.tileBody}>
        <View style={styles.tileTop}>
          <Text style={styles.tileName}>{destination.name}</Text>
          <SafetyBadge level={destination.safetyLevel} compact />
        </View>
        <Text style={styles.tileRegion}>{destination.region}</Text>
        <Text style={styles.tileBlurb} numberOfLines={2}>
          {destination.blurb}
        </Text>
        <View style={styles.tileFooter}>
          <Ionicons name="star" size={12} color={colors.accent400} />
          <Text style={styles.tileRating}>{destination.rating.toFixed(1)}</Text>
          <Text style={styles.tileMeta}>· {destination.temperature}</Text>
          <Text style={styles.tilePrice}>
            from ₹{destination.fromPrice.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
header: {
    gap: spacing.xs,
    paddingBottom: spacing.base,
  },
  title: {
    ...type.title,
    color: colors.text,
  },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.base, lineHeight: 21 },
  search: { marginTop: spacing.base },

content: { gap: layout.sectionGap, paddingBottom: spacing.xxl },
  rail: { gap: spacing.sm, paddingRight: spacing.lg },
  section: { gap: spacing.base },
  // Tiles wrap into as many columns as the window can hold.
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: layout.cardGap },
  pressed: { opacity: 0.94 },

  tile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tileImage: { backgroundColor: colors.surfaceAlt, height: 168, width: '100%' },
  tileBody: { gap: spacing.xs, padding: spacing.base },
  tileTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  tileName: {
    color: colors.text,
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  tileRegion: { color: colors.textMuted, fontSize: fontSize.xs },
  tileBlurb: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 19 },
  tileFooter: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: spacing.xs },
  tileRating: { color: colors.text, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  tileMeta: { color: colors.textMuted, fontSize: fontSize.xs },
  tilePrice: {
    color: colors.primary,
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textAlign: 'right',
  },

  empty: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.xl,
  },
  emptyTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  emptyBody: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 19,
    textAlign: 'center',
  },
  resetButton: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  resetText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
});