import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, gradients } from '@/theme';

type GradientName = keyof typeof gradients;

type Props = {
  /** Optional; a gradient can be used purely as a background fill. */
  children?: ReactNode;
  /** Named gradient from the theme so stops stay consistent. */
  variant?: GradientName;
  /** Explicit stops, for one-off surfaces that still read from tokens. */
  colorsOverride?: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
  style?: StyleProp<ViewStyle>;
  /** Render as the outermost element. */
  pointerEvents?: ComponentProps<typeof View>['pointerEvents'];
};

/**
 * Base gradient surface. Every coloured fill in the app goes through this so the
 * blue-to-white falloff stays identical across screens.
 */
export function GradientSurface({
  children,
  variant = 'hero',
  colorsOverride,
  locations,
  style,
  pointerEvents,
}: Props) {
  return (
    <LinearGradient
      colors={[...(colorsOverride ?? gradients[variant])] as [string, string, ...string[]]}
      locations={locations as [number, number, ...number[]] | undefined}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.fill, style]}
      pointerEvents={pointerEvents}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

export { colors as gradientTokens };
export type { GradientName };

/** Convenience wrapper for the standard app background. */
export function AppBackground({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[appStyles.app, style]}>
      <GradientSurface variant="hero" style={appStyles.appGradient} />
      {children}
    </View>
  );
}

const appStyles = StyleSheet.create({
  app: { backgroundColor: colors.background, flex: 1 },
  appGradient: {
    bottom: 0,
    left: 0,
    // Kept low so the gradient reads as a soft wash rather than a colour band.
    opacity: 0.6,
    position: 'absolute',
    right: 0,
    // Only the upper portion of the screen carries the tint.
    top: 0,
  },
});