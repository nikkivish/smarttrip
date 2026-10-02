import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';
import {
  contentColumn,
  useHorizontalGutter,
  useSideBySide,
} from '@/hooks/useResponsive';
import { colors, fontSize, fontWeight, layout, spacing } from '@/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const gutter = useHorizontalGutter();
  // Identity beside the contact list on a tablet or desktop, stacked on a phone.
  const split = useSideBySide(320);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Profile" subtitle="Account and preferences" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={contentColumn}
        contentContainerStyle={[styles.list, { paddingHorizontal: gutter }]}
      >
        <View style={{ flexDirection: split.direction, gap: split.gap }}>
          <View style={styles.pane}>
            <Card style={styles.identity}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() ?? '?'}
                </Text>
              </View>
              <View style={styles.identityText}>
                <Text style={styles.name}>{user?.name ?? 'Guest'}</Text>
                <Text style={styles.email}>{user?.email}</Text>
              </View>
            </Card>
          </View>

          <View style={styles.pane}>
            <Card style={styles.contacts}>
              <Text style={styles.sectionTitle}>Emergency contacts</Text>
              {user?.emergencyContacts?.length ? (
                user.emergencyContacts.map((contact) => (
                  <View key={contact.id} style={styles.contactRow}>
                    <View style={styles.contactText}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactMeta}>
                        {contact.relation} · {contact.phone}
                      </Text>
                    </View>
                    {contact.isPrimary ? <Text style={styles.primaryTag}>Primary</Text> : null}
                  </View>
                ))
              ) : (
                <Text style={styles.empty}>
                  No contacts yet. Add someone so we can reach you in an emergency.
                </Text>
              )}
              <Button
                label="Add contact"
                variant="outline"
                onPress={() => router.push('/safety/add-contact')}
                fullWidth
              />
            </Card>
          </View>
        </View>

        <Button label="Sign out" variant="ghost" onPress={logout} fullWidth style={styles.signOut} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  list: { gap: spacing.md, paddingBottom: spacing.xxl },
  // Holds each card at the same height as its neighbour on a wide screen.
  pane: { flex: 1 },
  identity: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, flex: 1 },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 999,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarText: { color: colors.primary, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  identityText: { flex: 1, gap: 2 },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  email: { color: colors.textSecondary, fontSize: fontSize.sm },
  contacts: { flex: 1, gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  contactRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  contactText: { flex: 1, gap: 2 },
  contactName: { color: colors.text, fontSize: fontSize.base },
  contactMeta: { color: colors.textMuted, fontSize: fontSize.sm },
  primaryTag: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  empty: { color: colors.textMuted, fontSize: fontSize.sm },
  signOut: { alignSelf: 'center', maxWidth: layout.readableMaxWidth, width: '100%' },
});