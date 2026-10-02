import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/lib/auth-context';
import { colors } from '@/theme';

export { ErrorBoundary } from 'expo-router';

function RootNavigator() {
  const { user } = useAuth();
  const isSignedIn = Boolean(user);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        {/*
          Anchor route. Always reachable so logged-out users and deep links have
          somewhere to land. It redirects once the session is known.
          Must not share its path with any other route.
        */}
        <Stack.Screen name="index" />

        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="destination/[slug]" />
          <Stack.Screen name="trip/[id]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="trip/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="profile" />
          <Stack.Screen
            name="safety/add-contact"
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="safety/sos" options={{ animation: 'fade' }} />
        </Stack.Protected>

        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
