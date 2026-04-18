import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Linking } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { MMKV } from 'react-native-mmkv';
import { supabase } from '@/services/supabase';
import { offlineQueue } from '@/services/offlineQueue';

const storage = new MMKV();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Extract the `code` query parameter from an auth callback URL.
 * Returns null if the URL is not an auth callback or has no code.
 */
function extractAuthCode(url: string): string | null {
  if (!url.includes('auth/callback')) {
    return null;
  }
  try {
    // Handle both `?code=` and `#code=` fragments
    const codeMatch = url.match(/[?&#]code=([^&#]+)/);
    return codeMatch ? codeMatch[1] : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  /**
   * Handle an incoming deep link URL for auth callbacks.
   * Extracts the authorization code and exchanges it for a session.
   */
  const handleDeepLink = async (url: string) => {
    const code = extractAuthCode(url);
    if (!code) {
      return;
    }

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setAuthError(error.message);
        Alert.alert(
          'Authentication Error',
          'The link is expired or invalid. Please try signing in again.',
        );
      }
      // On success, onAuthStateChange will fire and update user/session state,
      // which triggers the navigator to show authenticated screens.
    } catch {
      setAuthError('Failed to complete authentication. Please try again.');
      Alert.alert(
        'Authentication Error',
        'Something went wrong. Please try signing in again.',
      );
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for deep links
    const linkSubscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle initial URL if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => {
      subscription.unsubscribe();
      linkSubscription.remove();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'palette://auth/callback',
      },
    });
    return { error };
  };

  const signOut = async () => {
    setAuthError(null);
    await supabase.auth.signOut();

    // Clear sync-related MMKV keys
    offlineQueue.clear();
    storage.delete('sync_last_sync_at');
    storage.delete('sync_collection_updated_at');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        authError,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
