import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useScreenTopInset } from '@/components/DesktopNav';
import { AppBackground } from '@/components/ui/GradientSurface';
import { Button } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import {
  contentColumn,
  useGridCellWidth,
  useGridColumns,
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

/**
 * Plan tab: an entry point to the real planner form, plus the destination ideas
 * a traveller would start from. Nothing here is a placeholder button — every
 * control navigates somewhere useful.
 */
const SUGGESTED = ['coorg', 'manali', 'goa'] as const;

const STEPS = [
  {
    icon: 'map-outline',
    title: 'Where and when',
    body: 'Destination, dates and how many are travelling.',
  },
  {
    icon: 'wallet-outline',
    title: 'Budget and pace',
    body: 'We balance cost against a comfortable daily rhythm.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Safety notes',
    body: 'Each stop carries a safety level and what to avoid.',
  },
];

export default function PlanScreen() {
  const router = useRouter();

  const topInset = useScreenTopInset();
  const gutter = useHorizontalGutter();
  const isWide = useIsWide();
  // The steps and the starter ideas line up as cards on a tablet or desktop and
  // stay stacked on a phone.
  const gridColumns = useGridColumns(3);
  const cellWidth = useGridCellWidth(isWide ? gridColumns : 1);

  return (
    <AppBackground>
<View style={[styles.header, contentColumn, { paddingHorizontal: gutter, paddingTop: topInset }]}>
        <Text style={styles.title}>Plan a trip</Text>
        <Text style={styles.subtitle}>
          Answer a few questions and the planner builds a safety-aware itinerary.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={contentColumn}
        contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]}
      >
        <Button
          label="Start a new trip"
          icon="sparkles"
          size="lg"
          fullWidth
          style={styles.cta}
          onPress={() => router.push('/trip/new')}
        />

        <Pressable
          onPress={() => router.push('/assistant')}
          accessibilityRole="button"
          accessibilityLabel="Open the travel assistant"
          style={({ pressed }) => [styles.assistant, shadow.card, pressed && styles.pressed]}
        >
          <View style={styles.assistantIcon}>
            <Ionicons name="sparkles" size={18} color={colors.primary} />
          </View>
          <View style={styles.assistantBody}>
            <Text style={styles.assistantTitle}>Chat with the assistant</Text>
            <Text style={styles.assistantText}>
              Describe the trip in your own words. It will ask for anything missing, then build the
              day-by-day plan.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>

        <View style={styles.section}>
          <SectionHeading
            title="How it works"
            subtitle="Three steps, about two minutes"
          />
<View style={[styles.steps, isWide && styles.grid]}>
            {STEPS.map((step, i) => (
              <View key={step.title} style={[styles.step, isWide && { width: cellWidth }, shadow.card]}>
                <View style={styles.stepIcon}>
                  <Ionicons name={step.icon as never} size={18} color={colors.primary} />
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepTitle}>
                    {i + 1}. {step.title}
                  </Text>
                  <Text style={styles.stepText}>{step.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading
            title="Start from an idea"
            subtitle="Solo-friendly picks for this season"
            actionLabel="See all"
            onActionPress={() => router.push('/(tabs)/explore')}
          />
<View style={[styles.ideas, isWide && styles.grid]}>
            {SUGGESTED.map((slug) => {
              const destination = destinationList.find((d) => d.slug === slug);
              if (!destination) return null;

              return (
                <Pressable
                  key={slug}
                  onPress={() => router.push(`/destination/${slug}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Plan a trip to ${destination.name}`}
                  style={({ pressed }) => [
                    styles.idea,
                    isWide && { width: cellWidth },
                    shadow.card,
                    pressed && styles.pressed,
                  ]}
                >
                  <Image
                    source={images.destinations[slug]}
                    style={styles.ideaImage}
                    contentFit="cover"
                    transition={280}
                    cachePolicy="memory-disk"
                  />
                  <View style={styles.ideaBody}>
                    <Text style={styles.ideaName}>{destination.name}</Text>
                    <Text style={styles.ideaMeta}>{destination.bestSeason}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/safety/sos')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.safetyLink, pressed && styles.pressed]}
        >
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
          <Text style={styles.safetyLinkText}>
            Planning a risky trip? Check the safety toolkit first.
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      </ScrollView>
    </AppBackground>
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

  content: {
    gap: layout.sectionGap,
    paddingBottom: spacing.xxl,
  },
  section: { gap: spacing.base },
  // Keeps the primary action from stretching across a desktop window.
  cta: { alignSelf: 'center', maxWidth: layout.formMaxWidth, width: '100%' },

  assistant: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    maxWidth: layout.readableMaxWidth,
    padding: spacing.base,
    width: '100%',
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

steps: { gap: spacing.md },
  // Cards wrap once there is room for more than one per row.
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  step: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.base,
  },
  stepIcon: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  stepBody: { flex: 1, gap: 2 },
  stepTitle: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  stepText: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 19 },

  ideas: { gap: spacing.md },
  idea: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.md,
  },
  ideaImage: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, height: 56, width: 56 },
  ideaBody: { flex: 1, gap: 2, justifyContent: 'center' },
  ideaName: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  ideaMeta: { color: colors.textMuted, fontSize: fontSize.xs },

safetyLink: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.successBg,
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    maxWidth: layout.readableMaxWidth,
    padding: spacing.base,
    width: '100%',
  },
  safetyLinkText: { color: colors.textSecondary, flex: 1, fontSize: fontSize.sm, lineHeight: 19 },
  pressed: { opacity: 0.85 },
});