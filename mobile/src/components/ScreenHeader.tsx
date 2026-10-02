import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, type } from '@/theme';
import { useIsWide, useScreenContent } from '@/hooks/useResponsive';

type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

/**
 * Header for stack screens. It shares the centred content column with the rest
 * of the app so a wide window keeps the title aligned with the content instead
 * of pinning it to the far-left edge.
 */
export function ScreenHeader({ title, subtitle, action }: Props) {
  const insets = useSafeAreaInsets();
  const isWide = useIsWide();
  const screenContent = useScreenContent();

  return (
    <View style={styles.outer}>
      <View style={[styles.container, screenContent, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.text}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={isWide ? 2 : 2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {action}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Background only, so the wide-screen gutter does not paint the page edge.
  outer: { backgroundColor: colors.background },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.base,
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  text: { flex: 1, gap: 3 },
  // Matches the in-screen titles on the tab screens.
  title: { ...type.title, color: colors.text },
  subtitle: { ...type.caption, color: colors.textSecondary },
});