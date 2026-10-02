import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors, iconSize, layout, radius, shadow, spacing, type } from '@/theme';

type Props = {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  /** Voice search affordance on the right. */
  onVoicePress?: () => void;
  onSubmit?: () => void;
  onFilterPress?: () => void;
};

/**
 * Rounded search field. The right-hand icon switches to the microphone when
 * `onVoicePress` is provided.
 */
export function SearchBar({
  placeholder = 'Search destinations, stays, experiences',
  value,
  onChangeText,
  onVoicePress,
  onSubmit,
  onFilterPress,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={[styles.field, focused ? styles.fieldFocused : null]}>
        <Ionicons name="search" size={iconSize.md} color={colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          style={styles.input}
          accessibilityLabel="Search destinations"
        />
        {onVoicePress ? (
          <Pressable
            onPress={onVoicePress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Search by voice"
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name="mic-outline" size={iconSize.md} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>

      {onFilterPress ? (
        <Pressable
          onPress={onFilterPress}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          style={({ pressed }) => [styles.filterButton, shadow.card, pressed && styles.pressed]}
        >
          <Ionicons name="options-outline" size={iconSize.lg} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: spacing.sm },
  // Field and filter button share one height and radius so the row reads as a
  // single control instead of two mismatched blocks.
  field: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: layout.controlHeight,
    paddingHorizontal: spacing.base,
    ...shadow.card,
  },
  fieldFocused: { borderColor: colors.primary, borderWidth: 2 },
  input: {
    ...type.body,
    color: colors.text,
    flex: 1,
    // The field has a fixed height now, so the input centres instead of
    // adding its own vertical padding.
    paddingVertical: 0,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    height: layout.controlHeight,
    justifyContent: 'center',
    width: layout.controlHeight,
  },
  pressed: { opacity: 0.8 },
});

export const searchBarLabelStyle = {
  ...type.label,
  color: colors.textSecondary,
};