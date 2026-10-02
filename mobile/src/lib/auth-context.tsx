import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { authApi } from './api';
import { mapUser, type WireUser } from './mappers';
import { deleteStoredToken, getStoredToken, setStoredToken } from './token-storage';
import type { User } from '@/types';

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  // Delegates to the platform-aware store (SecureStore on iOS/Android,
  // localStorage-backed AsyncStorage on web). It never rejects, so the
  // bootstrap `catch` below cannot fail while trying to clean up.
  const persistToken = async (token: string | null) => {
    if (token) await setStoredToken(token);
    else await deleteStoredToken();
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = await getStoredToken();
        if (!token) {
          if (!cancelled) setState({ user: null, token: null, isLoading: false });
          return;
        }
        const user = mapUser(await authApi.me(token));
        if (!cancelled) setState({ user, token, isLoading: false });
      } catch {
        await persistToken(null);
        if (!cancelled) setState({ user: null, token: null, isLoading: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const applySession = useCallback(
    async (session: { token: string; user: WireUser }) => {
      await persistToken(session.token);
      setState({ user: mapUser(session.user), token: session.token, isLoading: false });
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login: async (email, password) => applySession(await authApi.login({ email, password })),
      register: async (input) => applySession(await authApi.register(input)),
      logout: async () => {
        await persistToken(null);
        setState({ user: null, token: null, isLoading: false });
      },
      refresh: async () => {
        if (!state.token) return;
        const user = mapUser(await authApi.me(state.token));
        setState((prev) => ({ ...prev, user }));
      },
    }),
    [applySession, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
