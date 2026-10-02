import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import {
  contentColumn,
  useFormColumn,
  useHorizontalGutter,
} from '@/hooks/useResponsive';
import { ApiError, safetyApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { colors, fontSize, spacing } from '@/theme';

export default function AddContactScreen() {
  const router = useRouter();
  const { token, refresh } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!token) return;
    setError(null);
    setBusy(true);
    try {
      await safetyApi.addContact(
        {
          name: name.trim(),
          phone: phone.trim(),
          relation: relation.trim(),
        },
        token,
      );
      // The profile screen reads contacts off the auth user, so refetch it.
      await refresh();
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add the contact.');
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = Boolean(token && name.trim() && phone.trim() && relation.trim());

  const gutter = useHorizontalGutter();
  const form = useFormColumn();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Stack.Screen options={{ title: 'Add contact' }} />
      <ScrollView
        style={contentColumn}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[form, { paddingHorizontal: gutter }]}>
          <Text style={styles.intro}>
            We will alert this person if you trigger an SOS or miss a check-in.
          </Text>

          <TextField label="Name" value={name} onChangeText={setName} placeholder="Full name" autoCapitalize="words" />
          <TextField
            label="Phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
          />
          <TextField
            label="Relation"
            value={relation}
            onChangeText={setRelation}
            placeholder="e.g. Mother, Colleague"
            autoCapitalize="words"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button
              label="Save contact"
              onPress={onSubmit}
              loading={busy}
              disabled={!canSubmit}
              fullWidth
            />
            <Button label="Cancel" variant="ghost" onPress={() => router.back()} fullWidth />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: spacing.md, paddingBottom: spacing.xxxl, paddingTop: spacing.lg },
  intro: { color: colors.textSecondary, fontSize: fontSize.sm },
  actions: { gap: spacing.sm, marginTop: spacing.base },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
