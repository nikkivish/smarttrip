import { Image, type ImageSource as ExpoImageSource } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, gradients, radius } from '@/theme';
import type { ImageSource } from '@/theme/images';
import { GradientSurface } from './GradientSurface';

type Props = {
  /** Local `require()` asset or remote URL, as declared in `@/theme/images`. */
  source: ImageSource;
  style?: StyleProp<ViewStyle>;
  /** How the image fills its frame. */
  resizeMode?: 'cover' | 'contain';
  /** Show the sky-gradient placeholder behind the image while it loads. */
  placeholder?: boolean;
  accessibilityLabel?: string;
};

/**
 * Image with a graceful fallback: a sky gradient sits behind the image, so a slow
 * or failed request degrades to a tinted panel rather than a blank rectangle.
 */
export function DestinationImage({
  source,
  style,
  resizeMode = 'cover',
  placeholder = true,
  accessibilityLabel,
}: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <View style={[styles.frame, style]}>
      {placeholder ? (
        <GradientSurface
          variant="imageFallback"
          colorsOverride={gradients.imageFallback}
          style={styles.placeholder}
        />
      ) : null}

      {!failed ? (
        <Image
          source={source as ExpoImageSource}
          style={[StyleSheet.absoluteFill, { opacity: loaded ? 1 : 0 }]}
          contentFit={resizeMode}
          transition={280}
          cachePolicy="memory-disk"
          accessibilityLabel={accessibilityLabel}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  placeholder: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});