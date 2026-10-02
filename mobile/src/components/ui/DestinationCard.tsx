import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { SafetyBadge } from '@/components/ui/SafetyBadge';
import { colors, gradients, images, radius, shadow, spacing, type } from '@/theme';
import type { Destination } from '@/theme/navigation';

type Props = {
  destination: Destination;
  /** `tall` for a 2-column grid, `wide` for a horizontal rail. */
  size?: 'tall' | 'wide';
  onPress?: () => void;
};

const CARD_HEIGHT = 236;
const WIDE_WIDTH = 232;

/**
 * Destination card: large rounded photo with the name and price over a gradient
 * scrim, and the safety badge sitting above the scrim so it stays legible.
 */
export function DestinationCard({ destination, size = 'tall', onPress }: Props) {
  const router = useRouter();
  const isWide = size === 'wide';

  return (
    <Pressable
      onPress={onPress ?? (() => router.push(`/destination/${destination.slug}`))}
      accessibilityRole="button"
      accessibilityLabel={`${destination.name}, ${destination.region}. Rated ${destination.rating} out of 5.`}
      style={({ pressed }) => [
        styles.card,
        isWide ? styles.wide : styles.tall,
        shadow.raised,
        pressed && styles.pressed,
      ]}
    >
      <Image
        source={images.destinations[destination.slug]}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={280}
        cachePolicy="memory-disk"
      />

      {/* Legibility scrim. */}
      <LinearGradient
        colors={[...gradients.scrim] as [string, string, ...string[]]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/*
        Only the safety badge sits here. A heart was drawn previously but had no
        action behind it, so it was removed rather than shipped as a dead
        affordance — saving lives on the destination screen.
      */}
      <View style={styles.topRow}>
        <SafetyBadge level={destination.safetyLevel} />
      </View>

      <View style={styles.footer}>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={13} color={colors.accent300} />
          <Text style={styles.rating}>{destination.rating.toFixed(1)}</Text>
          <Text style={styles.reviews}>({destination.reviews})</Text>
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {destination.name}
        </Text>
        <Text style={styles.region} numberOfLines={1}>
          {destination.region}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.from}>from</Text>
          <Text style={styles.price}>₹{destination.fromPrice.toLocaleString('en-IN')}</Text>
          <Text style={styles.perDay}>/day</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  tall: { height: CARD_HEIGHT },
  wide: { height: 190, width: WIDE_WIDTH },
  pressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },

  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    padding: spacing.md,
  },

  footer: {
    flex: 1,
    gap: 2,
    justifyContent: 'flex-end',
    padding: spacing.base,
  },
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  rating: {
    ...type.caption,
    color: colors.onImage,
    fontWeight: '700',
  },
  reviews: { ...type.overline, color: colors.onImageMuted, fontWeight: '500' },

  name: {
    ...type.subheading,
    color: colors.onImage,
    marginTop: 2,
  },
  region: { ...type.caption, color: colors.onImageMuted },

  priceRow: { alignItems: 'baseline', flexDirection: 'row', gap: 4, marginTop: spacing.sm },
  from: { ...type.overline, color: colors.onImageMuted, fontWeight: '500' },
  price: {
    ...type.subheading,
    color: colors.onImage,
  },
  perDay: { ...type.overline, color: colors.onImageMuted, fontWeight: '500' },
});