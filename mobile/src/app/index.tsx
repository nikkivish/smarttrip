import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth-context';

/**
 * Entry point. Owns the `/` path, so no other route may also be an index at the
 * root level -- otherwise the router would resolve `/` to whichever it saw first.
 */
export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  return <Redirect href={user ? '/(tabs)/home' : '/login'} />;
}
