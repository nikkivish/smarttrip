import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DestinationCard } from '@/components/ui/DestinationCard';
import { AppBackground } from '@/components/ui/GradientSurface';
import { Pill } from '@/components/ui/Pill';
import { SearchBar } from '@/components/ui/SearchBar';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useScreenTopInset } from '@/components/DesktopNav';
import { useAuth } from '@/lib/auth-context';
import {
  colors,
  currentWeather,
  destinationFilters,
  filterDestinations,
  iconSize,
  images,
  insightCards,
  layout,
  radius,
  searchDestinations,
  shadow,
  spacing,
  type,
} from '@/theme';
import { contentColumn, useGridCellWidth, useGridColumns, useHorizontalGutter, useIsWide } from '@/hooks/useResponsive';
import type { DestinationFilterKey } from '@/theme/navigation';

/**
 * Home.
 *
 * DEMO DATA: insights, the weather chip and the destination rail come from
 * `theme/navigation`, not the API. Only the greeting uses live data (the signed-in
 * user's name). Each demo block has a matching API shape in progress; swap the
 * source and the layout below stays as-is.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const topInset = useScreenTopInset();
  const isWide = useIsWide();
  const gutter = useHorizontalGutter();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<DestinationFilterKey>('all');

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  // Two cards per phone row, up to four on a wide window, so a desktop browser
  // gains columns instead of stretching two cards to full width.
  const columns = useGridColumns(4);
  const cellWidth = useGridCellWidth(columns);
  // The insight rail is a scroller, so it only needs to know how wide a card
  // should be rather than how many fit.
  const insightWidth = cellWidth > 0 ? Math.max(216, Math.min(cellWidth, 300)) : 216;

  const rail = useMemo(() => {
    const byFilter = filterDestinations(filter);
    if (!query.trim()) return byFilter.slice(0, 4);
    return searchDestinations(query).slice(0, 4);
  }, [filter, query]);

  const openExplore = () =>
    router.push({
      pathname: '/(tabs)/explore',
      params: query.trim() ? { q: query.trim() } : undefined,
    });

  // The filter icon hands the current search and filter over to Explore, which
  // owns the full filter rail.
  const openFilters = () =>
    router.push({
      pathname: '/(tabs)/explore',
      params: { f: filter, ...(query.trim() ? { q: query.trim() } : {}) },
    });

  return (
    <AppBackground>
      <View style={[styles.header, contentColumn, { paddingHorizontal: gutter, paddingTop: topInset }]}>
        <View style={styles.greetingRow}>
          <View style={styles.greetingText}>
            <Text style={styles.greeting}>Hi, {firstName}</Text>
            <Text style={styles.greetingSub}>Where to next?</Text>
          </View>

          <View style={styles.headerActions}>
            <View style={[styles.weatherChip, shadow.card]}>
              <Ionicons name={currentWeather.icon as never} size={iconSize.md} color={colors.warning} />
              <Text style={styles.weatherTemp}>{currentWeather.temperature}°</Text>
            </View>

            <Pressable
              onPress={() => router.push('/profile')}
              accessibilityRole="button"
              accessibilityLabel="Open your profile"
              // The desktop navigation carries the profile avatar, so the hero
              // keeps only the weather chip on a wide screen.
              style={({ pressed }) => [
                styles.avatar,
                shadow.card,
                isWide && styles.hiddenOnWide,
                pressed && styles.pressed,
              ]}
            >
              <Image
                source={user?.avatarUrl ? { uri: user.avatarUrl } : images.brand.avatarFallback}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.avatarBadge} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.title}>Ready to Explore</Text>
        <Text style={styles.subtitle}>
          {currentWeather.city} · {currentWeather.condition} ·{' '}
          {filterDestinations('safe').length} solo-safe picks
        </Text>

        <View style={styles.search}>
          <SearchBar
            placeholder="Search destinations or experiences"
            value={query}
            onChangeText={setQuery}
            onSubmit={openExplore}
            onVoicePress={openExplore}
            onFilterPress={openFilters}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={contentColumn}
        contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]}
      >
        <Pressable
          onPress={() => router.push('/assistant')}
          accessibilityRole="button"
          accessibilityLabel="Open the travel assistant"
          style={({ pressed }) => [styles.assistantBanner, shadow.card, pressed && styles.pressed]}
        >
          <View style={styles.assistantIcon}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
          </View>
          <View style={styles.assistantBody}>
            <Text style={styles.assistantTitle}>Ask the travel assistant</Text>
            <Text style={styles.assistantText}>
              Describe a trip, a budget or a packing list and get a day-by-day plan.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={iconSize.md} color={colors.textMuted} />
        </Pressable>

        {/* Insights Today */}
        <View style={styles.section}>
          <SectionHeading title="Insights Today" subtitle="Picked for you this morning" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
          >
            {insightCards.map((card) => (
              <InsightTile
                key={card.key}
                width={insightWidth}
                eyebrow={card.eyebrow}
                title={card.title}
                detail={card.detail}
                image={card.image.uri}
                icon={card.icon}
                onPress={() => router.push(`/destination/${card.slug}`)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Locals by AI */}
        <View style={styles.section}>
          <SectionHeading
            title="Locals by AI"
            subtitle={query.trim() ? `Matching “${query.trim()}”` : 'Ranked by safety and season'}
            actionLabel="See all"
            onActionPress={openExplore}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRail}
          >
            {destinationFilters.map((f) => (
              <Pill
                key={f.key}
                label={f.label}
                selected={filter === f.key}
                onPress={() => setFilter(f.key)}
              />
            ))}
          </ScrollView>

          {rail.length === 0 ? (
            <View style={[styles.empty, shadow.card]}>
              <Text style={styles.emptyTitle}>Nothing matched</Text>
              <Text style={styles.emptyBody}>
                Try a different filter, or search Explore for the full list.
              </Text>
              <Pressable
                onPress={() => {
                  setQuery('');
                  setFilter('all');
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
              >
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.grid}>
              {rail.map((destination) => (
                <View key={destination.slug} style={{ width: cellWidth }}>
                  <DestinationCard
                    destination={destination}
                    onPress={() => router.push(`/destination/${destination.slug}`)}
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

/* ---------------------------------- parts ---------------------------------- */

type InsightTileProps = {
  eyebrow: string;
  title: string;
  detail: string;
  image: string;
  icon: string;
  width: number;
  onPress: () => void;
};

function InsightTile({ eyebrow, title, detail, image, icon, width, onPress }: InsightTileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${eyebrow}: ${title}. ${detail}`}
      style={({ pressed }) => [
        styles.insightTile,
        { width },
        shadow.card,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.insightImageWrap}>
        <Image
          source={{ uri: image }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={280}
          cachePolicy="memory-disk"
        />
      </View>
      <View style={styles.insightBody}>
        <View style={styles.insightEyebrowRow}>
          <Ionicons name={icon as never} size={iconSize.xs} color={colors.primary} />
          <Text style={styles.insightEyebrow} numberOfLines={1}>
            {eyebrow}
          </Text>
        </View>
        <Text style={styles.insightTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.insightDetail} numberOfLines={2}>
          {detail}
        </Text>
      </View>
    </Pressable>
  );
}

/* --------------------------------- styling --------------------------------- */

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    paddingBottom: spacing.base,
  },
  greetingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  greetingText: { flex: 1, gap: 2 },
  greeting: { ...type.label, color: colors.textSecondary },
  greetingSub: { ...type.caption, color: colors.textMuted },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  weatherChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    // Matches the avatar so the two controls share a baseline and height.
    gap: 5,
    height: layout.headerControlSize,
    paddingHorizontal: spacing.md,
  },
  weatherTemp: {
    ...type.label,
    color: colors.text,
  },
  avatar: {
    borderRadius: radius.pill,
    height: layout.headerControlSize,
    overflow: 'hidden',
    width: layout.headerControlSize,
  },
  avatarImage: { height: '100%', width: '100%' },
  // Wide screens get the profile entry from the desktop navigation instead.
  hiddenOnWide: { display: 'none' },
  avatarBadge: {
    backgroundColor: colors.success,
    borderColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 2,
    bottom: 0,
    height: 11,
    position: 'absolute',
    right: 0,
    width: 11,
  },
  pressed: { opacity: 0.88 },

  // Prominent but no longer oversized: was 38px/800 with a 41.8px line box.
  title: { ...type.title, color: colors.text },
  subtitle: {
    ...type.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  search: { marginTop: spacing.lg },

  content: {
    gap: layout.sectionGap,
    paddingBottom: spacing.xxl,
  },
  section: { gap: spacing.base },

  rail: { gap: spacing.md, paddingRight: spacing.lg },
  filterRail: { gap: spacing.sm, paddingRight: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: layout.gridGap },

  empty: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.xl,
  },
  emptyTitle: { ...type.subheading, color: colors.text },
  emptyBody: { ...type.body, color: colors.textSecondary, textAlign: 'center' },
  resetButton: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  resetText: { ...type.label, color: colors.primary },

  assistantBanner: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.base,
  },
  assistantIcon: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  assistantBody: { flex: 1, gap: 2 },
  assistantTitle: { ...type.subheading, color: colors.text },
  assistantText: { ...type.caption, color: colors.textSecondary },

  insightTile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    // Same radius as every other card in the app.
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  insightImageWrap: { backgroundColor: colors.surfaceAlt, height: 100 },
  insightBody: { gap: 3, padding: spacing.base },
  insightEyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  insightEyebrow: {
    ...type.overline,
    color: colors.primary,
    flexShrink: 1,
    textTransform: 'uppercase',
  },
  insightTitle: { ...type.subheading, color: colors.text },
  // Secondary tone rather than muted: this is the explanatory line.
  insightDetail: { ...type.caption, color: colors.textSecondary },
});