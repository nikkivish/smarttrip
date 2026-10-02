import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, fontSize, fontWeight, radius, spacing } from '@/theme';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  error?: string | null;
  style?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize = 'none',
  error,
  style,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          // Focus ring, so keyboard navigation is visible on web and the field
          // still reads as one control on a phone.
          focused ? styles.inputFocused : null,
          error ? styles.inputError : null,
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
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
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: fontSize.xs },
});
