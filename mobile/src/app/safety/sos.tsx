import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { useCurrentLocation } from '@/hooks/useSafety';
import { useFormColumn, useHorizontalGutter } from '@/hooks/useResponsive';
import { safetyApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { colors, fontSize, fontWeight, spacing } from '@/theme';

export default function SosScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { locate } = useCurrentLocation();
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gutter = useHorizontalGutter();
  const form = useFormColumn();

  const onSend = async () => {
    if (!token) return;
    setIsSending(true);
    setError(null);
    try {
      const position = await locate();

      // The API requires coordinates, so without a fix we cannot send anything.
      // Say that plainly instead of implying an alert went out.
      if (!position) {
        setError(
          'Could not get your location, so no alert was sent. Turn on location services and try again, or call your local emergency number now.',
        );
        return;
      }

      const response = await safetyApi.sos(
        {
          latitude: position.latitude,
          longitude: position.longitude,
          message: `SOS from ${user?.name ?? 'SmartTrip user'}`,
        },
        token,
      );

      const { delivered, simulated } = response.notified;
      setResult(
        simulated
          ? 'Location shared, but SMS is not configured yet. Call your emergency contact directly.'
          : `Alerted ${delivered} emergency contact${delivered === 1 ? '' : 's'}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the alert');
      Alert.alert('Alert not sent', 'Please call your local emergency number directly.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.content, { paddingHorizontal: gutter }]}>
        <View style={form}>
          <Text style={styles.title}>Emergency SOS</Text>
          <Text style={styles.body}>
            This will share your live location and alert every emergency contact you have added.
          </Text>

          {result ? <Text style={styles.result}>{result}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button label="Send alert now" variant="danger" size="lg" fullWidth loading={isSending} onPress={onSend} />
            <Button label="Close" variant="ghost" onPress={() => router.back()} fullWidth />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingVertical: spacing.xl },
  title: { color: colors.danger, fontSize: fontSize.display, fontWeight: fontWeight.heavy },
  body: { color: colors.textSecondary, fontSize: fontSize.base, marginTop: spacing.sm },
  result: { color: colors.success, fontSize: fontSize.sm, marginTop: spacing.base },
  error: { color: colors.danger, fontSize: fontSize.sm, marginTop: spacing.base },
  actions: { gap: spacing.md, marginTop: spacing.xl },
});
