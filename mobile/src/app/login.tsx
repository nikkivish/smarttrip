import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthShell, AuthTextInput } from '@/components/AuthShell';
import { Button } from '@/components/ui/Button';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { colors, fontSize, fontWeight, images, spacing } from '@/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      mobileTitle="SmartTrip"
      mobileTitleStyle={styles.brand}
      mobileTagline="AI travel planning built around your safety"
      cardTitle="Welcome back"
      cardSubtitle="Sign in to pick up your trips, contacts and safety checks."
      image={images.destinations.udaipur}
      headline="Travel further, with someone watching out for you"
      points={[
        'AI day-by-day itineraries shaped to your budget and pace',
        'Solo-safety ratings before you book, not after',
        'Emergency contacts and check-ins for every trip',
      ]}
    >
      <View style={styles.form}>
        <AuthTextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <AuthTextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Sign in" onPress={onSubmit} loading={busy} disabled={!email || !password} fullWidth />
        <Button
          label="Create an account"
          variant="ghost"
          onPress={() => router.push('/register')}
          fullWidth
        />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  brand: { color: colors.primary, fontSize: fontSize.display, fontWeight: fontWeight.heavy },
  form: { gap: spacing.md, marginTop: spacing.xxl },
  error: { color: colors.danger, fontSize: fontSize.sm },
});