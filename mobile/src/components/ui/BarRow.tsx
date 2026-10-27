import { StyleSheet, Text, View } from 'react-native';

import { colors, fontWeight, radius, spacing } from '@/theme';

export function BarRow({
  label,
  valueLabel,
  percentage,
  tone = colors.primary,
}: {
  label: string;
  valueLabel: string;
  percentage: number;
  tone?: string;
}) {
  const bounded = Math.max(0, Math.min(100, Number.isFinite(percentage) ? percentage : 0));

  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{valueLabel}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { backgroundColor: tone, width: `${bounded}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm },
  labelRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  label: { color: colors.text, flex: 1, fontSize: 14, fontWeight: fontWeight.semibold },
  value: { color: colors.textSecondary, fontSize: 13 },
  track: { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, height: 8, overflow: 'hidden' },
  fill: { borderRadius: radius.pill, height: '100%' },
});
