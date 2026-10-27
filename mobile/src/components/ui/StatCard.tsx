import { StyleSheet, Text } from 'react-native';

import { Card } from './Card';
import { colors, fontSize, fontWeight, spacing } from '@/theme';

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, minHeight: 96 },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: fontWeight.medium },
  value: { color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
});
