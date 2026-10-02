import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const TOKEN_STORAGE_KEY = 'smarttrip.token';

/**
 * `expo-secure-store` only implements a real module on iOS/Android. Its web
 * build (`build/ExpoSecureStore.web.js`) is literally `export default {}`, so
 * calling `getItemAsync`/`setItemAsync`/`deleteItemAsync` on the web throws
 * "... is not a function". The check below therefore tests for the methods
 * themselves instead of trusting `Platform.OS`, which also covers native builds
 * where the keychain is unavailable (tvOS, simulators without a passcode).
 */
const canUseSecureStore =
  Platform.OS !== 'web' &&
  typeof SecureStore.getItemAsync === 'function' &&
  typeof SecureStore.setItemAsync === 'function' &&
  typeof SecureStore.deleteItemAsync === 'function';

/**
 * Reads the persisted auth token.
 *
 * Returns `null` when nothing is stored *or* when storage is unavailable
 * (private browsing, disabled `localStorage`, quota errors). Callers treat
 * `null` as "no session", which keeps the app booting instead of crashing.
 */
export async function getStoredToken(): Promise<string | null> {
  try {
    return canUseSecureStore
      ? await SecureStore.getItemAsync(TOKEN_STORAGE_KEY)
      : await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.warn('[auth] Could not read stored token; treating session as signed out.', error);
    return null;
  }
}

/**
 * Persists the auth token, replacing any previous value.
 *
 * Failures are logged and swallowed: a storage problem must not block a
 * successful sign-in, otherwise the user is left staring at the login form
 * even though the API accepted their credentials.
 */
export async function setStoredToken(token: string): Promise<void> {
  try {
    if (canUseSecureStore) {
      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
    } else {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  } catch (error) {
    console.warn('[auth] Could not persist token; session will not survive a reload.', error);
  }
}

/**
 * Removes the persisted auth token.
 *
 * Never throws and never resolves without attempting the delete, so signing out
 * always clears the stored credential even if the read/write path failed.
 */
export async function deleteStoredToken(): Promise<void> {
  try {
    if (canUseSecureStore) {
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    } else {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('[auth] Could not delete stored token.', error);
  }
}