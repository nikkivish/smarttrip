import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type } from '@/theme';

type Props = {
  title: string;
  /** Optional supporting line under the title. */
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

/** Section title with an optional trailing text action. */
export function SectionHeading({ title, subtitle, actionLabel, onActionPress }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onActionPress ? (
        <Pressable
          onPress={onActionPress}
          hitSlop={8}
          accessibilityRole="button"
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: { flex: 1, gap: 3 },
  title: {
    ...type.heading,
    color: colors.text,
  },
  // Secondary tone, not muted: this line carries meaning at 12px.
  subtitle: { ...type.caption, color: colors.textSecondary },
  action: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionLabel: {
    ...type.label,
    color: colors.primary,
  },
  pressed: { opacity: 0.7 },
});