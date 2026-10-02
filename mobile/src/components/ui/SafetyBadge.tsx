import { StyleSheet, Text, View } from 'react-native';

import { radius, safetyColor, type, type SafetyLevel } from '@/theme';

type Props = {
  level: SafetyLevel;
  label?: string;
  compact?: boolean;
};

export function SafetyBadge({ level, label, compact }: Props) {
  const tone = safetyColor[level];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: tone.bg },
        compact && styles.compact,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: tone.fg }]} />
      <Text style={[styles.label, { color: tone.fg }]}>{label ?? tone.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  compact: { paddingHorizontal: 8, paddingVertical: 3 },
  dot: { borderRadius: radius.pill, height: 6, width: 6 },
  // Colour is always supplied at render time from the safety level token.
  label: { ...type.overline },
});
