import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthShell, AuthTextInput } from '@/components/AuthShell';
import { Button } from '@/components/ui/Button';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { colors, fontSize, images, spacing } from '@/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const nameValid = form.name.trim().length >= 2 && form.name.trim().length <= 80;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const passwordValid = form.password.length >= 8 && form.password.length <= 200;
  const phoneValid = !form.phone.trim() || (form.phone.trim().length >= 6 && form.phone.trim().length <= 20);
  const canSubmit = nameValid && emailValid && passwordValid && phoneValid;

  const onSubmit = async () => {
    setError(null);
    if (!canSubmit) {
      setError('Use a name with 2+ characters, a valid email, a password with 8+ characters, and a phone with 6+ digits if provided.');
      return;
    }
    setBusy(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim() || undefined,
      });
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      mobileTitle="Create your account"
      cardTitle="Create your account"
      cardSubtitle="One account for trips, emergency contacts and check-ins."
      image={images.destinations.munnar}
      headline="Build trips that know when to check in"
      points={[
        'Solo-safe destinations ranked for first-time travellers',
        'A phone number for alerts, set up once',
        'Plans you can hand straight to the AI assistant',
      ]}
    >
      <View style={styles.form}>
        <AuthTextInput
          placeholder="Full name"
          value={form.name}
          onChangeText={set('name')}
          autoCapitalize="words"
        />
        <AuthTextInput
          placeholder="Email"
          value={form.email}
          onChangeText={set('email')}
          keyboardType="email-address"
        />
        <AuthTextInput
          placeholder="Phone (for alerts)"
          value={form.phone}
          onChangeText={set('phone')}
          keyboardType="phone-pad"
        />
        <AuthTextInput
          placeholder="Password"
          value={form.password}
          onChangeText={set('password')}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Create account"
          onPress={onSubmit}
          loading={busy}
          disabled={!canSubmit}
          fullWidth
        />
        <Button
          label="I already have an account"
          variant="ghost"
          onPress={() => router.back()}
          fullWidth
        />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, marginTop: spacing.xl },
  error: { color: colors.danger, fontSize: fontSize.sm },
});