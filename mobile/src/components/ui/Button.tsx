import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontWeight, radius, shadow, spacing, type } from '@/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  /** Pill radius for rounded buttons. Default is true. */
  rounded?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
};

const containerByVariant: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceAlt, borderColor: colors.surfaceAlt },
  outline: { backgroundColor: colors.surface, borderColor: colors.borderStrong },
  ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  accent: { backgroundColor: colors.accent400, borderColor: colors.accent400 },
};

const labelByVariant: Record<Variant, string> = {
  primary: colors.onPrimary,
  secondary: colors.text,
  outline: colors.text,
  ghost: colors.primary,
  danger: colors.onPrimary,
  accent: colors.textInverse,
};

/** Variants that sit on a solid fill need a shadow to lift off the surface. */
const shadowedVariants = new Set<Variant>(['primary', 'danger', 'accent']);

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  rounded = true,
  icon,
  style,
}: Props) {
  const isInactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isInactive, busy: !!loading }}
      disabled={isInactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        rounded ? styles.rounded : styles.squared,
        containerByVariant[variant],
        shadowedVariants.has(variant) && shadow.pill,
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        pressed && !isInactive && styles.pressed,
        isInactive && styles.disabled,
        style,
      ]}
    >
      {icon ? (
        <Ionicons name={icon as never} size={16} color={labelByVariant[variant]} />
      ) : null}
      <Text style={[styles.label, sizeStyles[size].labelSize, { color: labelByVariant[variant] }]}>
        {loading ? 'Please wait…' : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  rounded: { borderRadius: radius.pill },
  squared: { borderRadius: radius.md },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.5 },
  fullWidth: { alignSelf: 'stretch' },
  // The family comes from the type scale; only weight varies per variant.
  label: { ...type.label, fontWeight: fontWeight.semibold },
});

const sizeStyles: Record<Size, ViewStyle & { labelSize: { fontSize: number } }> = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, labelSize: { fontSize: 13 } },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, labelSize: { fontSize: 15 } },
  lg: { paddingVertical: spacing.base, paddingHorizontal: spacing.xl, labelSize: { fontSize: 17 } },
};
