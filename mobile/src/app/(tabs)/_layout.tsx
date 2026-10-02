import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DesktopChromeProvider, DesktopNav } from '@/components/DesktopNav';
import { FloatingTabBar } from '@/components/ui/FloatingTabBar';
import { useIsWide } from '@/hooks/useResponsive';
import { colors, layout, spacing } from '@/theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const isWide = useIsWide();

  // The floating dock sits above the bottom inset, so the reserved space has to
  // include it too. A fixed constant left content hidden behind the dock on
  // devices with a home indicator. Wide screens use the top navigation instead,
  // so they need no dock space at all.
  const dockSpace = isWide
    ? 0
    : layout.floatingNavHeight + Math.max(insets.bottom, spacing.sm);

  return (
    <DesktopChromeProvider>
      <View style={styles.root}>
        {isWide ? <DesktopNav /> : null}
        <View style={styles.scenes}>
          <Tabs
            tabBar={(props) => (isWide ? <></> : <FloatingTabBar {...props} />)}
            screenOptions={{
              headerShown: false,
              // Clear the floating dock so content is never hidden behind it.
              tabBarStyle: { height: 0 },
              sceneStyle: {
                backgroundColor: colors.background,
                paddingBottom: dockSpace,
              },
            }}
          >
            <Tabs.Screen name="home" options={{ title: 'Home' }} />
            <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
            <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
            <Tabs.Screen name="trips" options={{ title: 'Trips' }} />
            <Tabs.Screen name="safety" options={{ title: 'Safety' }} />
          </Tabs>
        </View>
      </View>
    </DesktopChromeProvider>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  scenes: { flex: 1 },
});