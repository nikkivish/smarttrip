import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, fontWeight, radius, shadow, spacing } from '@/theme';

type Props = {
  label: string;
  icon: string;
  onPress?: () => void;
};

/**
 * Compact card used in the Insights Today rail: rounded, white, with an icon in
 * a sky-tinted well. Becomes a button when `onPress` is supplied.
 */
export function InsightCard({ label, icon, onPress }: Props) {
  const body = (
    <>
      <View style={styles.iconWell}>
        <Ionicons name={icon as never} size={16} color={colors.primary} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </>
  );

  if (!onPress) return <View style={[styles.card, shadow.card]}>{body}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.card, shadow.card, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    width: 148,
  },
  iconWell: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  label: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.sm * 1.35,
  },
  pressed: { opacity: 0.85 },
});