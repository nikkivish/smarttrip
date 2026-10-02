import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_PORT = 4000;

function inferHost(): string {
  if (Platform.OS === 'android') return '10.0.2.2';
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) return host;
  }
  return 'localhost';
}

const fallbackUrl = `http://${inferHost()}:${DEFAULT_PORT}/api/v1`;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? fallbackUrl;

export const REQUEST_TIMEOUT_MS = 20000;
