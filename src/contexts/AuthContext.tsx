import { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getEmailConfirmRedirectUrl } from '../lib/authRedirect';
import { normalizeUsername } from '../lib/displayName';
import { getSupabaseClient, isSupabaseConfigured, resetSupabaseClient } from '../lib/supabase';
import { assertUsernameAvailable, ensureUsernameClaimedFromMetadata } from '../lib/usernames';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (
        nextSession?.user &&
        (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED')
      ) {
        void ensureUsernameClaimedFromMetadata(nextSession.user);
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    await ensureUsernameClaimedFromMetadata(data.user);
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    const emailRedirectTo = getEmailConfirmRedirectUrl();
    const displayName = normalizeUsername(username);
    await assertUsernameAvailable(displayName);
    const { data, error } = await getSupabaseClient().auth.signUp({
      email,
      password,
      options: {
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
        data: {
          username: displayName,
          display_name: displayName,
        },
      },
    });
    if (error) {
      throw error;
    }
    if (data.user) {
      await ensureUsernameClaimedFromMetadata(data.user);
    }
  }, []);

  const signOut = useCallback(async () => {
    await getSupabaseClient().auth.signOut();
    resetSupabaseClient();
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [session, isLoading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
