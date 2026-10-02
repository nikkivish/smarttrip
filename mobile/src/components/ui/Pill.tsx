import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadow, spacing, type } from '@/theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  count?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Pill-shaped category filter. Selected pills fill with sky blue and use an
 * inverse icon tint, so the active filter reads at a glance in a horizontal rail.
 */
export function Pill({ label, selected = false, onPress, icon, count, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        shadow.pill,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon ? <View style={[styles.icon, selected && styles.iconSelected]}>{icon}</View> : null}
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelIdle]}>
        {label}
      </Text>
      {typeof count === 'number' ? (
        <Text style={[styles.count, selected ? styles.labelSelected : styles.labelIdle]}>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  unselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: { opacity: 0.85 },
  icon: { marginRight: 2 },
  iconSelected: { opacity: 1 },
  label: {
    ...type.label,
    color: colors.textSecondary,
  },
  labelIdle: { color: colors.textSecondary },
  labelSelected: { color: colors.onPrimary },
  count: {
    ...type.caption,
    fontVariant: ['tabular-nums'],
  },
});