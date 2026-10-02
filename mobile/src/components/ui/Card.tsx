import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadow, spacing } from '@/theme';

type Props = {
  children: React.ReactNode;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, padded = true, style }: Props) {
  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    ...shadow.card,
  },
  padded: { padding: spacing.base },
});
