import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SafetyBadge } from '@/components/ui/SafetyBadge';
import { useTrips } from '@/hooks/useTrips';
import {
  contentColumn,
  useHorizontalGutter,
  useTranscriptColumn,
} from '@/hooks/useResponsive';
import { ApiError, assistantApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  colors,
  fontWeight,
  iconSize,
  layout,
  radius,
  shadow,
  spacing,
  type,
} from '@/theme';
import type {
  AssistantDetails,
  AssistantPlan,
  AssistantPlanItem,
  AssistantReply,
  SafetyLevel,
} from '@/types';

const STARTERS = [
  'Plan a 3-day trip under ₹10,000',
  'Suggest a solo trip',
  'Create a relaxed weekend itinerary',
  'What should I pack?',
] as const;

const CATEGORY_ICON: Record<AssistantPlanItem['category'], string> = {
  transport: 'bus-outline',
  stay: 'bed-outline',
  food: 'restaurant-outline',
  activity: 'compass-outline',
  shopping: 'bag-handle-outline',
};

type Turn = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  reply?: AssistantReply;
};

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

const addDays = (iso: string, n: number) => {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return isoDay(date);
};

const asLevel = (value: string): SafetyLevel => value.toLowerCase() as SafetyLevel;

export default function AssistantScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { trips } = useTrips();
  const scrollRef = useRef<ScrollView>(null);

  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [details, setDetails] = useState<AssistantDetails>({});
  const [lastReply, setLastReply] = useState<AssistantReply | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const [isAdopting, setIsAdopting] = useState(false);
  const [pickingTrip, setPickingTrip] = useState(false);

  const scrollToEnd = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  const send = useCallback(
    async (raw: string) => {
      const message = raw.trim();
      if (!message || !token || isBusy) return;

      setError(null);
      setFailedMessage(null);
      setInput('');
      setTurns((prev) => [
        ...prev,
        { id: `u-${prev.length}`, role: 'user', text: message },
      ]);

      const history = turns
        .filter((turn) => turn.role === 'user')
        .map((turn) => ({ message: turn.text }));

      setIsBusy(true);
      try {
        const reply = await assistantApi.send({ message, details, history }, token);
        setDetails(reply.details);
        setLastReply(reply);
        setPickingTrip(false);
        setTurns((prev) => [
          ...prev,
          { id: `a-${prev.length}`, role: 'assistant', text: reply.reply, reply },
        ]);
      } catch (err) {
        const message2 =
          err instanceof ApiError
            ? err.message
            : 'Could not reach the assistant. Check your connection and try again.';
        setError(message2);
        setFailedMessage(message);
      } finally {
        setIsBusy(false);
      }
    },
    [details, isBusy, token, turns],
  );

  const onAdopt = useCallback(
    async (tripId?: string) => {
      const plan = lastReply?.itinerary;
      if (!plan || !token) return;

      const startDate = details.startDate ?? isoDay(new Date());
      const days = details.days ?? plan.days.length;
      const endDate = details.endDate ?? addDays(startDate, Math.max(0, days - 1));

      setIsAdopting(true);
      setError(null);
      try {
        const result = await assistantApi.adopt(
          {
            tripId,
            itinerary: plan,
            destination: plan.destination,
            startDate,
            endDate,
            travellers: details.travellers ?? 1,
            budget: details.budget,
          },
          token,
        );
        router.replace(`/trip/${result.trip.id}`);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not save this itinerary.');
      } finally {
        setIsAdopting(false);
      }
    },
    [details, lastReply, router, token],
  );

  const hasConversation = turns.length > 0;
  const gutter = useHorizontalGutter();
  const transcript = useTranscriptColumn();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Stack.Screen options={{ title: 'Travel assistant' }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={[styles.flex, contentColumn]}
          contentContainerStyle={[styles.content, { paddingHorizontal: gutter }]}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToEnd}
        >
          {/* Keeps the transcript at a readable width instead of spanning a monitor. */}
          <View style={transcript}>
            {!hasConversation ? (
              <View style={styles.introBlock}>
                <View style={styles.introIcon}>
                  <Ionicons name="sparkles" size={20} color={colors.primary} />
                </View>
                <Text style={styles.introTitle}>Plan with the assistant</Text>
                <Text style={styles.introBody}>
                  Ask about a destination, a budget, a packing list or a full day-by-day plan. I will
                  ask for anything I still need before building the itinerary.
                </Text>
              </View>
            ) : null}

            {turns.map((turn) =>
              turn.role === 'user' ? (
                <View key={turn.id} style={styles.userRow}>
                  <View style={styles.userBubble}>
                    <Text style={styles.userText}>{turn.text}</Text>
                  </View>
                </View>
              ) : (
                <View key={turn.id} style={styles.assistantRow}>
                  <View style={styles.avatar}>
                    <Ionicons name="sparkles" size={iconSize.sm} color={colors.primary} />
                  </View>
                  <View style={styles.assistantColumn}>
                    {turn.reply?.source === 'mock' ? (
                      <View style={styles.demoTag}>
                        <Ionicons name="information-circle-outline" size={12} color={colors.warning} />
                        <Text style={styles.demoTagText}>Demo template, not live AI</Text>
                      </View>
                    ) : null}

                    <Card style={styles.bubble}>
                      <Text style={styles.bubbleText}>{turn.text}</Text>
                    </Card>

                    {turn.reply?.itinerary ? (
                      <PlanPreview
                        plan={turn.reply.itinerary}
                        isAdopting={isAdopting}
                        pickingTrip={pickingTrip}
                        trips={trips.map((trip) => ({ id: trip.id, title: trip.title }))}
                        onSaveNew={() => onAdopt()}
                        onPickTrip={() => setPickingTrip((prev) => !prev)}
                        onPickExisting={(id) => onAdopt(id)}
                      />
                    ) : null}
                  </View>
                </View>
              ),
            )}

            {isBusy ? (
              <View style={styles.assistantRow}>
                <View style={styles.avatar}>
                  <Ionicons name="sparkles" size={iconSize.sm} color={colors.primary} />
                </View>
                <View style={styles.thinking}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.thinkingText}>Working on it…</Text>
                </View>
              </View>
            ) : null}

            {error ? (
              <Card style={styles.errorCard}>
                <View style={styles.errorHead}>
                  <Ionicons name="alert-circle-outline" size={iconSize.md} color={colors.danger} />
                  <Text style={styles.errorTitle}>Something went wrong</Text>
                </View>
                <Text style={styles.errorBody}>{error}</Text>
                {failedMessage ? (
                  <Button
                    label="Try again"
                    variant="outline"
                    size="sm"
                    onPress={() => send(failedMessage)}
                  />
                ) : null}
              </Card>
            ) : null}

            {!hasConversation ? (
              <View style={styles.starters}>
                {STARTERS.map((starter) => (
                  <Pressable
                    key={starter}
                    onPress={() => send(starter)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.starter, pressed && styles.pressed]}
                  >
                    <Ionicons name="arrow-forward-circle-outline" size={iconSize.md} color={colors.primary} />
                    <Text style={styles.starterText}>{starter}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            </View>
        </ScrollView>

        <View style={styles.composer}>
          <View style={[styles.composerInner, { paddingHorizontal: gutter }]}>
            <TextInput
              style={[styles.input, focused && styles.inputFocused]}
              value={input}
              onChangeText={setInput}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Ask about a trip, budget or packing list"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={1000}
              editable={!isBusy}
              accessibilityLabel="Message the travel assistant"
            />
            <Button
              label="Send"
              icon="send"
              size="md"
              onPress={() => send(input)}
              loading={isBusy}
              disabled={input.trim().length === 0}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type PlanPreviewProps = {
  plan: AssistantPlan;
  trips: { id: string; title: string }[];
  isAdopting: boolean;
  pickingTrip: boolean;
  onSaveNew: () => void;
  onPickTrip: () => void;
  onPickExisting: (id: string) => void;
};

function PlanPreview({
  plan,
  trips,
  isAdopting,
  pickingTrip,
  onSaveNew,
  onPickTrip,
  onPickExisting,
}: PlanPreviewProps) {
  return (
    <Card style={styles.planCard}>
      <View style={styles.planHead}>
        <Text style={styles.planTitle}>{plan.title}</Text>
        <SafetyBadge level={asLevel(plan.safetyLevel)} label={`Safety ${plan.safetyScore}/100`} />
      </View>
      <Text style={styles.planSummary}>{plan.summary}</Text>

      {plan.days.map((day) => (
        <View key={day.day} style={styles.dayBlock}>
          <Text style={styles.dayTitle}>
            Day {day.day} · {day.title}
          </Text>
          {day.summary ? <Text style={styles.daySummary}>{day.summary}</Text> : null}

          {day.items.map((item, index) => (
            <View key={`${day.day}-${index}`} style={styles.itemRow}>
              <Text style={styles.itemTime}>{item.time}</Text>
              <View style={styles.itemBody}>
                <View style={styles.itemTitleRow}>
                  <Ionicons
                    name={CATEGORY_ICON[item.category] as never}
                    size={iconSize.sm}
                    color={colors.primary}
                  />
                  <Text style={styles.itemTitle}>{item.title}</Text>
                </View>
                {item.placeLabel ? <Text style={styles.itemPlace}>{item.placeLabel}</Text> : null}
                {item.description ? (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                ) : null}
                {item.safetyLevel ? (
                  <View style={styles.itemBadge}>
                    <SafetyBadge level={asLevel(item.safetyLevel)} compact />
                  </View>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ))}

      {plan.safetyNotes.length ? (
        <View style={styles.notesBlock}>
          <Text style={styles.notesTitle}>Safety notes</Text>
          {plan.safetyNotes.map((note, index) => (
            <View key={index} style={styles.noteRow}>
              <Ionicons name="shield-checkmark-outline" size={iconSize.xs} color={colors.success} />
              <Text style={styles.noteText}>{note}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.planActions}>
        <Button
          label="Save as new trip"
          icon="add-circle-outline"
          onPress={onSaveNew}
          loading={isAdopting}
          fullWidth
        />
        <Button
          label={pickingTrip ? 'Choose a trip' : 'Add to existing trip'}
          icon="albums-outline"
          variant="outline"
          onPress={onPickTrip}
          disabled={trips.length === 0 || isAdopting}
          fullWidth
        />
        {trips.length === 0 ? (
          <Text style={styles.noTripsHint}>You have no saved trips yet.</Text>
        ) : null}

        {pickingTrip && trips.length ? (
          <View style={styles.tripList}>
            {trips.map((trip) => (
              <Pressable
                key={trip.id}
                onPress={() => onPickExisting(trip.id)}
                accessibilityRole="button"
                disabled={isAdopting}
                style={({ pressed }) => [styles.tripChip, pressed && styles.pressed]}
              >
                <Ionicons name="map-outline" size={iconSize.sm} color={colors.primary} />
                <Text style={styles.tripChipText} numberOfLines={1}>
                  {trip.title}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  flex: { flex: 1 },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg,
  },

  introBlock: { alignItems: 'flex-start', gap: spacing.sm },
  introIcon: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  introTitle: { ...type.heading, color: colors.text },
  introBody: { ...type.body, color: colors.textSecondary },

  userRow: { alignItems: 'flex-end' },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
    borderRadius: radius.lg,
    maxWidth: '85%',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  userText: { ...type.body, color: colors.onPrimary },

  assistantRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  assistantColumn: { flex: 1, gap: spacing.sm },

  demoTag: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.warningBg,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  demoTagText: { ...type.caption, color: colors.warning, fontWeight: fontWeight.semibold },

  bubble: { padding: spacing.base },
  bubbleText: { ...type.body, color: colors.text },

  thinking: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  thinkingText: { ...type.caption, color: colors.textMuted },

  starters: { gap: spacing.sm },
  starter: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  starterText: { ...type.bodyStrong, color: colors.text, flex: 1 },
  pressed: { opacity: 0.82 },

  planCard: { gap: spacing.md, marginTop: spacing.xs },
  planHead: { alignItems: 'flex-start', gap: spacing.sm },
  planTitle: { ...type.subheading, color: colors.text },
  planSummary: { ...type.body, color: colors.textSecondary },

  dayBlock: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    gap: spacing.sm,
    padding: spacing.md,
  },
  dayTitle: { ...type.label, color: colors.primaryDark },
  daySummary: { ...type.caption, color: colors.textMuted },

  itemRow: { flexDirection: 'row', gap: spacing.md },
  itemTime: { ...type.label, color: colors.primary, width: 44 },
  itemBody: { flex: 1, gap: 2 },
  itemTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  itemTitle: { ...type.bodyStrong, color: colors.text, flex: 1 },
  itemPlace: { ...type.caption, color: colors.textMuted },
  itemDescription: { ...type.caption, color: colors.textSecondary },
  itemBadge: { alignSelf: 'flex-start', marginTop: 2 },

  notesBlock: { backgroundColor: colors.successBg, borderRadius: radius.md, gap: spacing.xs, padding: spacing.md },
  notesTitle: { ...type.label, color: colors.success },
  noteRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.xs },
  noteText: { ...type.caption, color: colors.textSecondary, flex: 1 },

  planActions: { gap: spacing.sm },
  noTripsHint: { ...type.caption, color: colors.textMuted, textAlign: 'center' },
  tripList: { gap: spacing.xs },
  tripChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tripChipText: { ...type.label, color: colors.text, flexShrink: 1 },

  errorCard: { backgroundColor: colors.dangerBg, borderColor: colors.danger, gap: spacing.sm },
  errorHead: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  errorTitle: { ...type.label, color: colors.danger },
  errorBody: { ...type.caption, color: colors.textSecondary },

  composer: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing.md,
    ...shadow.card,
  },
  // Matches the transcript width so the field does not stretch on a desktop.
  composerInner: {
    alignItems: 'flex-end',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    maxWidth: layout.transcriptMaxWidth,
    width: '100%',
  },
  input: {
    ...type.body,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    maxHeight: 110,
    minHeight: 44,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  inputFocused: { borderColor: colors.primary, borderWidth: 2 },
});
