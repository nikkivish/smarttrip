import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsDesktop, useIsWide } from '@/hooks/useResponsive';
import { useAuth } from '@/lib/auth-context';
import { colors, images, layout, radius, shadow, spacing, tabs, type } from '@/theme';

type DesktopChrome = { hasTopNav: boolean };

const DesktopChromeContext = createContext<DesktopChrome>({ hasTopNav: false });

/**
 * Lets the tabs layout tell its screens whether the wide-screen navigation is
 * present. Screens use `useScreenTopInset` so the safe-area inset is only
 * applied once: the nav bar consumes it on wide screens, the screen header
 * consumes it on a phone.
 */
export function DesktopChromeProvider({ children }: { children: ReactNode }) {
  const hasTopNav = useIsWide();
  const value = useMemo<DesktopChrome>(() => ({ hasTopNav }), [hasTopNav]);

  return (
    <DesktopChromeContext.Provider value={value}>{children}</DesktopChromeContext.Provider>
  );
}

/**
 * Top padding for a tab screen's own header. Returns the safe-area inset plus
 * the header rhythm on a phone, and plain header rhythm when the desktop nav
 * already handled the inset.
 */
export function useScreenTopInset(): number {
  const insets = useSafeAreaInsets();
  const { hasTopNav } = useContext(DesktopChromeContext);
  return hasTopNav ? spacing.lg : insets.top + spacing.md;
}

/**
 * Horizontal navigation for tablet and desktop, in place of the floating dock.
 *
 * It sits in the normal flow above the tab navigator rather than floating, so
 * screens never have to reserve matching padding and the bar cannot overlap
 * content. Active state reads the pathname, which keeps the current tab lit
 * while a detail screen is pushed on top.
 */
export function DesktopNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  const activeKey = useMemo(() => {
    const match = tabs.find((tab) => pathname === `/${tab.key}` || pathname === tab.href);
    return match?.key ?? null;
  }, [pathname]);

  return (
    <View style={[styles.bar, shadow.card, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.inner}>
        <Pressable
          onPress={() => router.navigate('/(tabs)/home')}
          accessibilityRole="button"
          accessibilityLabel="SmartTrip home"
          style={({ pressed }) => [styles.brand, pressed && styles.pressed]}
        >
          <Image source={images.brand.mark} style={styles.mark} contentFit="cover" />
          <Text style={styles.brandText}>SmartTrip</Text>
        </Pressable>

        <View style={styles.links} accessibilityRole="tablist">
          {tabs.map((tab) => {
            const active = activeKey === tab.key;
            const focused = focusedKey === tab.key;

            return (
              <Pressable
                key={tab.key}
                onPress={() => router.navigate(tab.href)}
                onFocus={() => setFocusedKey(tab.key)}
                onBlur={() => setFocusedKey(null)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={tab.label}
                style={({ pressed }) => [
                  styles.link,
                  active && styles.linkActive,
                  focused && styles.focusRing,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={(active ? tab.iconActive : tab.icon) as never}
                  size={16}
                  color={active ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.linkText, active && styles.linkTextActive]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          accessibilityLabel="Open your profile"
          style={({ pressed }) => [styles.profile, pressed && styles.pressed]}
        >
          <Image
            source={user?.avatarUrl ? { uri: user.avatarUrl } : images.brand.avatarFallback}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
          {isDesktop ? (
            <View style={styles.profileText}>
              <Text style={styles.profileName} numberOfLines={1}>
                {user?.name ?? 'Your profile'}
              </Text>
              <Text style={styles.profileLabel} numberOfLines={1}>
                Profile &amp; emergency contacts
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: spacing.sm,
  },
  // Shares the app's content column so the brand lines up with page content.
  inner: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.base,
    height: layout.desktopNavHeight,
    maxWidth: layout.contentMaxWidth,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  brand: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  mark: { borderRadius: radius.sm, height: 30, width: 30 },
  brandText: { ...type.subheading, color: colors.text },

  links: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.xs },
  link: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  linkActive: { backgroundColor: colors.primaryLight },
  focusRing: { borderColor: colors.primary, borderWidth: 2 },
  linkText: { ...type.label, color: colors.textSecondary },
  linkTextActive: { color: colors.primary, fontWeight: '700' },

  profile: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  avatar: { borderRadius: radius.pill, height: 36, width: 36 },
  profileText: { gap: 1, maxWidth: 190 },
  profileName: { ...type.label, color: colors.text },
  profileLabel: { ...type.caption, color: colors.textMuted },

  pressed: { opacity: 0.7 },
});