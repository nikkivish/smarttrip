import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useIsWide } from '@/hooks/useResponsive';
import { colors, fontSize, fontWeight, gradients, images, radius, shadow, spacing, type } from '@/theme';
import type { ImageSource } from '@/theme/images';

type Props = {
  /** Leading line on the phone layout, styled by the screen. */
  mobileTitle: string;
  mobileTitleStyle?: StyleProp<TextStyle>;
  mobileTagline?: string;
  /** Heading inside the desktop form card. */
  cardTitle: string;
  cardSubtitle?: string;
  /** Photography for the desktop value panel. */
  image: ImageSource;
  headline: string;
  points: readonly string[];
  children: ReactNode;
};

/**
 * Auth shell for the sign-in and registration screens.
 *
 * A phone keeps the original single-column layout untouched. Tablet and desktop
 * get a split view: a branded travel panel on the left and the form in a
 * centred card on the right, so the inputs stop stretching across a monitor.
 */
export function AuthShell({
  mobileTitle,
  mobileTitleStyle,
  mobileTagline,
  cardTitle,
  cardSubtitle,
  image,
  headline,
  points,
  children,
}: Props) {
  const isWide = useIsWide();

  if (!isWide) {
    return (
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.mobileContainer}
        >
          <Text style={[styles.mobileTitle, mobileTitleStyle]}>{mobileTitle}</Text>
          {mobileTagline ? <Text style={styles.mobileTagline}>{mobileTagline}</Text> : null}
          {children}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.split}>
      <View style={styles.panel}>
        <Image
          source={image}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={280}
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={[...gradients.scrim] as [string, string, ...string[]]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        {/* Sky wash so the panel still reads as SmartTrip rather than a photo. */}
        <LinearGradient
          colors={['rgba(2,132,199,0.55)', 'rgba(2,132,199,0.18)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.panelBody}>
          <View style={styles.panelBrand}>
            <Image source={images.brand.mark} style={styles.panelMark} contentFit="cover" />
            <Text style={styles.panelBrandText}>SmartTrip</Text>
          </View>

          <View style={styles.panelCopy}>
            <Text style={styles.headline}>{headline}</Text>
            <View style={styles.points}>
              {points.map((point) => (
                <View key={point} style={styles.point}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.accent300} />
                  <Text style={styles.pointText}>{point}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.formSide}>
        <ScrollView
          contentContainerStyle={styles.formSideContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle} accessibilityRole="header">
              {cardTitle}
            </Text>
            {cardSubtitle ? <Text style={styles.cardSubtitle}>{cardSubtitle}</Text> : null}
            {children}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  // Matches the phone layout the screens shipped with.
  mobileContainer: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  mobileTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  mobileTagline: { color: colors.textSecondary, fontSize: fontSize.base, marginTop: spacing.xs },

  split: { backgroundColor: colors.background, flex: 1, flexDirection: 'row' },

  panel: { flex: 1, overflow: 'hidden', position: 'relative' },
  panelBody: { flex: 1, justifyContent: 'space-between', padding: spacing.xxl },
  panelBrand: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  panelMark: { borderRadius: radius.sm, height: 32, width: 32 },
  panelBrandText: { ...type.subheading, color: colors.textInverse },
  panelCopy: { gap: spacing.lg, maxWidth: 420 },
  headline: { ...type.display, color: colors.textInverse },
  points: { gap: spacing.md },
  point: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  pointText: { ...type.body, color: colors.onImageMuted, flex: 1 },

  formSide: { flex: 1 },
  formSideContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  card: { gap: spacing.xs, maxWidth: 420, width: '100%' },
  cardTitle: { ...type.title, color: colors.text },
  cardSubtitle: { ...type.body, color: colors.textSecondary },
});

/** Shared card fill for the desktop form card, exposed so screens can nest rows. */
export const authCardStyle = { borderRadius: radius.card, ...shadow.card };

type AuthInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
};

/**
 * Inline field for the auth screens. Same metrics as the fields the screens
 * shipped with, plus a focus ring so keyboard navigation is visible on web.
 */
export function AuthTextInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
}: AuthInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      style={[inputStyles.input, focused && inputStyles.inputFocused]}
      value={value}
      onChangeText={onChangeText}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
    />
  );
}

const inputStyles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: fontSize.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  inputFocused: { borderColor: colors.primary, borderWidth: 2 },
});