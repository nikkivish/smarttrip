import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { DestinationImage } from '@/components/ui/DestinationImage';
import { Pill } from '@/components/ui/Pill';
import { SafetyBadge } from '@/components/ui/SafetyBadge';
import { SectionHeading } from '@/components/ui/SectionHeading';
import {
  contentColumn,
  useGridCellWidth,
  useGridColumns,
  useHorizontalGutter,
  useIsWide,
  useSideBySide,
} from '@/hooks/useResponsive';
import {
  colors,
  destinations,
  fontSize,
  fontWeight,
  gradients,
  layout,
  radius,
  shadow,
  spacing,
} from '@/theme';

/**
 * DEMO DATA. Destination details come from `theme/navigation`, not the API. No
 * endpoint exists for destination content yet.
 */
export default function DestinationDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);

  const destination = slug ? destinations[slug as keyof typeof destinations] : undefined;

  const gutter = useHorizontalGutter();
  const isWide = useIsWide();
  // Wide screens put the stay cards and the "you might also like" rail beside
  // the main copy instead of running both full width underneath it.
  const split = useSideBySide(360);
  const relatedColumns = useGridColumns(3);
  const relatedCellWidth = useGridCellWidth(relatedColumns);

  if (!destination) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingTitle}>Destination not found</Text>
        <Button label="Back to Explore" variant="primary" onPress={() => router.back()} />
      </View>
    );
  }

  const related = Object.values(destinations)
    .filter((d) => d.slug !== destination.slug)
    .slice(0, 4);

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, isWide && styles.heroWide]}>
          <Image
            source={destination.image}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={280}
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={[...gradients.scrim] as [string, string, ...string[]]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.heroNav, { paddingTop: insets.top + spacing.sm }]}>
            <View style={[styles.heroNavInner, { paddingHorizontal: gutter }]}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
              >
                <Ionicons name="chevron-back" size={20} color={colors.onImage} />
              </Pressable>
              <View style={styles.heroNavRight}>
                <Pressable
                  hitSlop={10}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSaved((v) => !v);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: saved }}
                  accessibilityLabel={saved ? 'Remove from saved' : 'Save destination'}
                  style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
                >
                  <Ionicons
                    name={saved ? 'heart' : 'heart-outline'}
                    size={18}
                    color={saved ? colors.accent300 : colors.onImage}
                  />
                </Pressable>
                <Pressable
                  hitSlop={10}
                  onPress={() => {
                    void Share.share({
                      message: `${destination.name}, ${destination.region} — solo-friendly and rated ${destination.rating} on SmartTrip.`,
                    }).catch(() =>
                      Alert.alert('Share unavailable', 'Sharing is not available on this device.'),
                    );
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Share destination"
                  style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
                >
                  <Ionicons name="share-outline" size={18} color={colors.onImage} />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.heroFooter}>
            <View style={[contentColumn, { paddingHorizontal: gutter }]}>
              <SafetyBadge level={destination.safetyLevel} />
              <Text style={styles.heroName}>{destination.name}</Text>
              <Text style={styles.heroRegion}>
                {destination.region} · {destination.tripCount}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.body, contentColumn, { paddingHorizontal: gutter }]}>
          {/* Quick stats */}
          <View style={styles.stats}>
            <Stat icon="star" label="Rating" value={destination.rating.toFixed(1)} />
            <Stat icon="calendar-outline" label="Best season" value={destination.bestSeason} />
            <Stat icon="thermometer-outline" label="Now" value={destination.temperature} />
          </View>

          {/* Tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRail}>
            {destination.tags.map((tag) => (
              <Pill key={tag} label={tag} />
            ))}
          </ScrollView>

          <View style={{ flexDirection: split.direction, gap: split.gap }}>
            <View style={styles.column}>
              {/* Overview */}
              <View style={styles.section}>
                <SectionHeading title="Why it works for solo travel" />
                <Text style={styles.paragraph}>{destination.blurb}</Text>
              </View>

              {/* Safety */}
              <View style={[styles.safetyCard, shadow.card]}>
                <View style={styles.safetyHead}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.success} />
                  <Text style={styles.safetyTitle}>Safety note</Text>
                </View>
                <Text style={styles.safetyBody}>{destination.safetyNote}</Text>
              </View>

              {/* Stays */}
              <View style={styles.section}>
                <SectionHeading
                  title="Where to stay"
                  actionLabel="See all"
                  onActionPress={() =>
                    Alert.alert(
                      'Stays',
                      'Stay listings are not part of this milestone yet. The planner is the next step.',
                    )
                  }
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stayRail}>
                  {['Heritage haveli', 'Lakeside resort', 'Old town guesthouse'].map((name) => (
                    <Pressable
                      key={name}
                      onPress={() => router.push('/trip/new')}
                      accessibilityRole="button"
                      accessibilityLabel={`Plan a stay at a ${name} in ${destination.name}`}
                      style={({ pressed }) => [styles.stayCard, shadow.card, pressed && styles.pressed]}
                    >
                      <DestinationImage
                        source={destination.image}
                        style={styles.stayImage}
                        resizeMode="cover"
                      />
                      <View style={styles.stayBody}>
                        <Text style={styles.stayName} numberOfLines={1}>
                          {name}
                        </Text>
                        <Text style={styles.stayMeta}>
                          from ₹{destination.fromPrice.toLocaleString('en-IN')} / night
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Nearby */}
            <View style={styles.column}>
              <View style={styles.section}>
                <SectionHeading title="You might also like" />
                <View style={styles.relatedGrid}>
                  {related.map((d) => (
                    <Pressable
                      key={d.slug}
                      onPress={() => router.replace(`/destination/${d.slug}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`${d.name}, ${d.region}`}
                      style={({ pressed }) => [
                        styles.relatedCard,
                        isWide && { width: relatedCellWidth },
                        shadow.card,
                        pressed && styles.pressed,
                      ]}
                    >
                      <DestinationImage source={d.image} style={styles.relatedImage} />
                      <View style={styles.relatedBody}>
                        <Text style={styles.relatedName} numberOfLines={1}>
                          {d.name}
                        </Text>
                        <Text style={styles.relatedRegion} numberOfLines={1}>
                          {d.region}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.ctaBar, shadow.float]}>
        <View style={[styles.ctaInner, { paddingHorizontal: gutter }]}>
          <View style={styles.ctaPrice}>
            <Text style={styles.ctaFrom}>from</Text>
            <Text style={styles.ctaAmount}>
              ₹{destination.fromPrice.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.ctaPer}>/day</Text>
          </View>
          <Button
            label="Plan this trip"
            onPress={() =>
              router.push({ pathname: '/trip/new', params: { destination: destination.name } })
            }
            style={styles.ctaButton}
          />
        </View>
      </View>
    </View>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={[styles.stat, shadow.card]}>
      <Ionicons name={icon as never} size={15} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },

  missing: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.base,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  missingTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.bold },

  hero: { backgroundColor: colors.surfaceAlt, height: 380 },
  // A taller hero on a wide window so it does not read as a thin letterbox.
  heroWide: { height: 460 },
  heroNav: { flexDirection: 'row' },
  // Lines the hero controls up with the page content column.
  heroNavInner: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: layout.contentMaxWidth,
    width: '100%',
  },
  heroNavRight: { flexDirection: 'row', gap: spacing.sm },
  circleButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.34)',
    borderRadius: radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  pressed: { opacity: 0.8 },
  heroFooter: { bottom: spacing.xl, left: 0, position: 'absolute', right: 0 },
  heroName: {
    color: colors.onImage,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -1,
    marginTop: spacing.xs,
  },
  heroRegion: { color: colors.onImageMuted, fontSize: fontSize.base },

  body: { gap: spacing.xxl, paddingVertical: spacing.lg },
  // Each column of the wide-screen body split.
  column: { flex: 1, gap: spacing.xxl },
  stats: { flexDirection: 'row', gap: spacing.md, marginTop: -spacing.xxl },
  stat: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    paddingVertical: spacing.md,
  },
  statValue: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.bold },
  statLabel: { color: colors.textMuted, fontSize: fontSize.xs },

  tagRail: { gap: spacing.sm },
  section: { gap: spacing.sm },
  paragraph: { color: colors.textSecondary, fontSize: fontSize.base, lineHeight: 24 },

  safetyCard: {
    backgroundColor: colors.successBg,
    borderRadius: radius.lg,
    gap: spacing.xs,
    padding: spacing.base,
  },
  safetyHead: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  safetyTitle: { color: colors.success, fontSize: fontSize.base, fontWeight: fontWeight.bold },
  safetyBody: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 20 },

  stayRail: { gap: spacing.md, paddingRight: spacing.lg },
  stayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    width: 190,
  },
  stayImage: { borderRadius: 0, height: 104 },
  stayBody: { gap: 2, padding: spacing.md },
  stayName: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  stayMeta: { color: colors.textMuted, fontSize: fontSize.xs },

  relatedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  relatedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    width: '48%',
  },
  relatedImage: { borderRadius: 0, height: 96 },
  relatedBody: { gap: 1, padding: spacing.md },
  relatedName: { color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  relatedRegion: { color: colors.textMuted, fontSize: fontSize.xs },

  ctaBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingVertical: spacing.md,
    position: 'absolute',
    right: 0,
  },
  // Keeps the sticky price and action inside the content column.
  ctaInner: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.base,
    justifyContent: 'space-between',
    maxWidth: layout.contentMaxWidth,
    width: '100%',
  },
  ctaPrice: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  ctaFrom: { color: colors.textMuted, fontSize: fontSize.xs },
  ctaAmount: { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.heavy },
  ctaPer: { color: colors.textMuted, fontSize: fontSize.xs },
  ctaButton: { flex: 1 },
});