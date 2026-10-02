import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, iconSize, layout, radius, shadow, spacing, tabs, type } from '@/theme';

/**
 * Minimal shape of the tab-bar props used here. Declared locally because
 * `@react-navigation/bottom-tabs` is not a direct dependency of this package.
 */
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    navigate: (name: string) => void;
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
  };
};

/** Tab route names are the `key` of the matching entry in the theme. */
const metaFor = (routeName: string) => tabs.find((t) => t.key === routeName);

/** `/home`, from the grouped href `/(tabs)/home`. */
const pathFor = (key: string) => `/${key}`;

/**
 * Floating pill navigation. Detached from the bottom edge with a soft shadow,
 * the active item marked by a sky-filled pill behind the icon rather than by
 * colour alone.
 */
export function FloatingTabBar({ state, navigation }: TabBarProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.dock, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}
      pointerEvents="box-none"
    >
      <View style={[styles.bar, shadow.float]}>
        {state.routes.map((route, index) => {
          const meta = metaFor(route.name);
          if (!meta) return null;

          const focused = state.index === index;
          // A path match keeps the tab lit when a detail screen is pushed on top.
          const active = focused || pathname === pathFor(meta.key);

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={meta.label}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <View style={[styles.iconPill, active && styles.iconPillActive]}>
                <Ionicons
                  name={(active ? meta.iconActive : meta.icon) as never}
                  size={iconSize.lg}
                  color={active ? colors.onPrimary : colors.textSecondary}
                />
              </View>
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.base,
    position: 'absolute',
    right: 0,
  },
  bar: {
    alignItems: 'center',
    // Fixed height so the space reserved in the tabs layout can never be
    // outgrown by the bar's own content.
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    height: layout.floatingNavHeight,
    // Keeps the dock thumb-sized instead of spanning a desktop window.
    maxWidth: layout.tabBarMaxWidth,
    paddingHorizontal: spacing.xs,
    width: '100%',
  },
  item: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    height: layout.floatingNavHeight,
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  iconPill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 30,
    justifyContent: 'center',
    width: 44,
  },
  iconPillActive: { backgroundColor: colors.primary },
  label: {
    ...type.tabLabel,
    color: colors.textSecondary,
  },
  labelActive: { color: colors.primary },
});