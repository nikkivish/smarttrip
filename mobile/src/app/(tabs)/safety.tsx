import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useScreenTopInset } from '@/components/DesktopNav';
import { AppBackground } from '@/components/ui/GradientSurface';
import { Button } from '@/components/ui/Button';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useCurrentLocation, useSafetyAlerts } from '@/hooks/useSafety';
import {
  contentColumn,
  useHorizontalGutter,
  useSideBySide,
} from '@/hooks/useResponsive';
import { safetyApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { colors, fontSize, fontWeight, radius, shadow, spacing, type } from '@/theme';
import type { SafetyAlert } from '@/types';

const severityTone: Record<SafetyAlert['severity'], { fg: string; bg: string; icon: string }> = {
  info: { fg: colors.info, bg: '#E0F2FE', icon: 'information-circle' },
  warning: { fg: colors.warning, bg: colors.warningBg, icon: 'warning-outline' },
  critical: { fg: colors.danger, bg: colors.dangerBg, icon: 'alert-circle-outline' },
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function SafetyScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { coords, locate, isLocating, error: locationError } = useCurrentLocation();
  const { alerts, isLoading, acknowledge } = useSafetyAlerts();

  const topInset = useScreenTopInset();
  const gutter = useHorizontalGutter();
  // Tablet and desktop get the toolkit beside the alert feed instead of one
  // very long single column.
  const split = useSideBySide(340);

  const [checkInState, setCheckInState] = useState<'idle' | 'busy' | 'done'>('idle');
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const criticalCount = useMemo(
    () => alerts.filter((a) => a.severity === 'critical' && !a.acknowledged).length,
    [alerts],
  );

  const onCheckIn = async () => {
    if (!token) return;
    setCheckInState('busy');
    setCheckInError(null);
    try {
      const position = coords ?? (await locate());
      if (!position) {
        setCheckInError(locationError ?? 'Location is unavailable');
        setCheckInState('idle');
        return;
      }
      await safetyApi.checkIn(
        { latitude: position.latitude, longitude: position.longitude },
        token,
      );
      setCheckInState('done');
    } catch (err) {
      setCheckInError(err instanceof Error ? err.message : 'Could not send the check-in');
      setCheckInState('idle');
    }
  };

  return (
    <AppBackground>
      <View style={[styles.header, contentColumn, { paddingHorizontal: gutter, paddingTop: topInset }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Safety</Text>
            <Text style={styles.subtitle}>Your toolkit, always one tap away</Text>
          </View>
          {criticalCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {criticalCount} urgent
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={contentColumn}
        contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]}
      >
        <View style={{ flexDirection: split.direction, gap: split.gap }}>
          <View style={styles.column}>
            {/* SOS */}
            <View style={[styles.sosCard, shadow.float]}>
              <View style={styles.sosIcon}>
                <Ionicons name="alert-circle" size={34} color={colors.danger} />
              </View>
              <Text style={styles.sosTitle}>Need help right now?</Text>
              <Text style={styles.sosBody}>
                Shares your live location and alerts every emergency contact you have added.
              </Text>
              <Button
                label="Emergency SOS"
                variant="danger"
                size="lg"
                fullWidth
                style={styles.sosButton}
                onPress={() => router.push('/safety/sos')}
              />
            </View>

            {/* Quick actions */}
            <View style={styles.quickRow}>
              <QuickAction
                icon="location-outline"
                label="Live location"
                onPress={() => setSharing((v) => !v)}
              />
              <QuickAction
                icon="people-outline"
                label="Trusted contacts"
                onPress={() => router.push('/safety/add-contact')}
              />
              <QuickAction
                icon="call-outline"
                label="Emergency services"
                onPress={() => {
                  // India uses 112 as the single emergency number.
                  void Linking.openURL('tel:112').catch(() =>
                    Alert.alert('Emergency services', 'Call 112 from your phone dialer.'),
                  );
                }}
              />
            </View>

            {sharing ? (
              <View style={[styles.locationCard, shadow.card]}>
                <View style={styles.locationHead}>
                  <Ionicons name="navigate" size={20} color={colors.primary} />
                  <Text style={styles.locationTitle}>Location sharing</Text>
                </View>
                {coords ? (
                  <>
                    <Text style={styles.coords}>
                      {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
                    </Text>
                    <Text style={styles.coordsHint}>
                      Sharing is on. Your contacts can see this point during an alert.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.coordsHint}>
                      Turn on location to start sharing your position.
                    </Text>
                    <Button
                      label="Get location"
                      variant="outline"
                      loading={isLocating}
                      onPress={() => void locate()}
                      fullWidth
                    />
                  </>
                )}
              </View>
            ) : null}

            {/* Check in */}
            <View style={[styles.card, shadow.card]}>
              <View style={styles.cardHead}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                <View style={styles.cardHeadText}>
                  <Text style={styles.cardTitle}>Check in safely</Text>
                  <Text style={styles.cardBody}>Let your contacts know you arrived safely.</Text>
                </View>
              </View>

              {checkInState === 'done' ? (
                <Text style={styles.success}>Check-in sent to your contacts.</Text>
              ) : null}
              {checkInError ? <Text style={styles.error}>{checkInError}</Text> : null}

              <Button
                label={coords ? 'Send check-in' : 'Get location & check in'}
                variant="outline"
                fullWidth
                loading={checkInState === 'busy' || isLocating}
                onPress={onCheckIn}
              />
            </View>
          </View>

          {/* Alerts */}
          <View style={styles.column}>
            <View style={styles.section}>
              <SectionHeading title="Recent alerts" subtitle={`${alerts.length} total`} />

              {isLoading ? (
                <ActivityIndicator color={colors.primary} style={styles.loader} />
              ) : alerts.length === 0 ? (
                <View style={[styles.card, shadow.card]}>
                  <Text style={styles.cardBody}>No alerts yet.</Text>
                </View>
              ) : (
                alerts.slice(0, 10).map((alert) => {
                  const tone = severityTone[alert.severity];
                  return (
                    <Pressable
                      key={alert.id}
                      onPress={() => (alert.acknowledged ? undefined : void acknowledge(alert.id))}
                      disabled={alert.acknowledged}
                      style={({ pressed }) => [pressed && styles.pressed]}
                    >
                      <View style={[styles.alert, shadow.card]}>
                        <View style={[styles.alertIcon, { backgroundColor: tone.bg }]}>
                          <Text style={[styles.alertIconGlyph, { color: tone.fg }]}>
                            {alert.severity === 'critical' ? '!' : alert.severity === 'warning' ? '!' : 'i'}
                          </Text>
                        </View>

                        <View style={styles.alertBody}>
                          <View style={styles.alertTop}>
                            <Text style={[styles.severityText, { color: tone.fg }]}>
                              {alert.severity.toUpperCase()}
                            </Text>
                            <Text style={styles.alertTime}>{relativeTime(alert.createdAt)}</Text>
                          </View>
                          <Text style={[styles.alertMessage, alert.acknowledged && styles.dimmed]}>
                            {alert.message}
                          </Text>
                          {alert.acknowledged ? (
                            <Text style={styles.acknowledged}>Acknowledged</Text>
                          ) : (
                            <Text style={styles.tapHint}>Tap to acknowledge</Text>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </AppBackground>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.quick, shadow.card, pressed && styles.pressed]}
    >
      <View style={styles.quickIcon}>
        <Ionicons name={icon as never} size={18} color={colors.primary} />
      </View>
      <Text style={styles.quickLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: spacing.md },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  headerText: { flex: 1, gap: 2 },
  title: {
    ...type.title,
    color: colors.text,
  },
  subtitle: { ...type.body, color: colors.textSecondary },
  badge: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: { color: colors.danger, fontSize: fontSize.xs, fontWeight: fontWeight.bold },

  content: { paddingBottom: spacing.xxl },
  // Holds the toolkit and the alert feed side by side once there is room.
  column: { flex: 1, gap: spacing.base },

  sosCard: {
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: radius.card,
    gap: spacing.xs,
    padding: spacing.xl,
  },
  sosIcon: { alignItems: 'center', marginBottom: spacing.xs },
  sosTitle: {
    color: colors.danger,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  sosBody: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  sosButton: { marginTop: spacing.md },

  quickRow: { flexDirection: 'row', gap: spacing.md },
  quick: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    paddingVertical: spacing.base,
  },
  quickIcon: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  quickLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  pressed: { opacity: 0.85 },

  locationCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.base,
  },
  locationHead: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  locationTitle: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  coords: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontVariant: ['tabular-nums'],
    fontWeight: fontWeight.bold,
  },
  coordsHint: { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: 17 },

  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.base,
  },
  cardHead: { flexDirection: 'row', gap: spacing.md },
  cardHeadText: { flex: 1, gap: 2 },
  cardTitle: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  cardBody: { color: colors.textSecondary, fontSize: fontSize.sm, lineHeight: 19 },
  success: { color: colors.success, fontSize: fontSize.sm },
  error: { color: colors.danger, fontSize: fontSize.sm },

  section: { gap: spacing.md },
  loader: { marginVertical: spacing.lg },

  alert: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.base,
  },
  alertIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  alertIconGlyph: { fontSize: fontSize.base, fontWeight: fontWeight.heavy },
  alertBody: { flex: 1, gap: 3 },
  alertTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  severityText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 0.3 },
  alertTime: { color: colors.textMuted, fontSize: fontSize.xs },
  alertMessage: { color: colors.text, fontSize: fontSize.sm, lineHeight: 19 },
  dimmed: { color: colors.textMuted },
  acknowledged: { color: colors.success, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  tapHint: { color: colors.primary, fontSize: fontSize.xs },
});