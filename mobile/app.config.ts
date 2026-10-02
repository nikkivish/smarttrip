import type { ExpoConfig, ConfigContext } from 'expo/config';

const BRAND = '#4C1D95';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'SmartTrip',
  slug: 'smarttrip',
  scheme: 'smarttrip',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    ...config.ios,
    supportsTablet: true,
    bundleIdentifier: 'com.smarttrip.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'SmartTrip uses your location to show nearby safety ratings, share your trip with trusted contacts, and send help when you need it.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'SmartTrip uses your location in the background so your emergency contacts can find you if you trigger an alert.',
    },
  },
  android: {
    ...config.android,
    package: 'com.smarttrip.app',
    adaptiveIcon: {
      backgroundColor: BRAND,
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'POST_NOTIFICATIONS',
      'VIBRATE',
    ],
    predictiveBackGestureEnabled: false,
    ...(process.env.GOOGLE_MAPS_API_KEY
      ? { config: { googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY } } }
      : {}),
  },
  web: {
    ...config.web,
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-image',
    'expo-secure-store',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: BRAND,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'SmartTrip uses your location to show nearby safety ratings and share your trip with trusted contacts.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: BRAND,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
  },
});
