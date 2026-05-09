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
  signUp: (email: string, password: string, options?: { curatorName?: string }) => Promise<{ error: any }>;
  signInWithOAuth: (provider: 'apple' | 'google') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  deleteAccount: () => Promise<{ error: any }>;
  updateProfile: (data: { curatorName?: string }) => Promise<{ error: any }>;
  uploadAvatar: (uri: string) => Promise<{ url: string | null; error: any }>;
  curatorName: string;
  avatarUrl: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractAuthParams(url: string): { code?: string; accessToken?: string; refreshToken?: string } | null {
  if (!url.includes('auth/callback')) {
    return null;
  }
  try {
    const codeMatch = url.match(/[?&#]code=([^&#]+)/);
    if (codeMatch) return { code: codeMatch[1] };

    const accessTokenMatch = url.match(/[#&]access_token=([^&#]+)/);
    const refreshTokenMatch = url.match(/[#&]refresh_token=([^&#]+)/);
    if (accessTokenMatch && refreshTokenMatch) {
      return { accessToken: accessTokenMatch[1], refreshToken: refreshTokenMatch[1] };
    }

    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [curatorName, setCuratorName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const loadProfile = async (currentUser: User) => {
    // Load from MMKV cache first (instant)
    const cachedName = storage.getString(`curator_name_${currentUser.id}`) ?? '';
    const cachedAvatar = storage.getString(`avatar_url_${currentUser.id}`) ?? null;
    setCuratorName(cachedName);
    setAvatarUrl(cachedAvatar);

    // Then fetch from Supabase profiles table (async, updates if different)
    const { data } = await supabase
      .from('profiles')
      .select('curator_name, avatar_url')
      .eq('id', currentUser.id)
      .single();

    if (data) {
      if (data.curator_name && data.curator_name !== cachedName) {
        setCuratorName(data.curator_name);
        storage.set(`curator_name_${currentUser.id}`, data.curator_name);
      }
      if (data.avatar_url && data.avatar_url !== cachedAvatar) {
        setAvatarUrl(data.avatar_url);
        storage.set(`avatar_url_${currentUser.id}`, data.avatar_url);
      }
    }
  };

  const handleDeepLink = async (url: string) => {
    const params = extractAuthParams(url);
    if (!params) return;

    try {
      let error: any = null;

      if (params.code) {
        const result = await supabase.auth.exchangeCodeForSession(params.code);
        error = result.error;
      } else if (params.accessToken && params.refreshToken) {
        const result = await supabase.auth.setSession({
          access_token: params.accessToken,
          refresh_token: params.refreshToken,
        });
        error = result.error;
      }

      if (error) {
        setAuthError(error.message);
        Alert.alert(
          'Authentication Error',
          'The link is expired or invalid. Please try signing in again.',
        );
      }
    } catch {
      setAuthError('Failed to complete authentication. Please try again.');
      Alert.alert(
        'Authentication Error',
        'Something went wrong. Please try signing in again.',
      );
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user);
      }
      setLoading(false);
    });

    const linkSubscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

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

  const signUp = async (email: string, password: string, options?: { curatorName?: string }) => {
    setAuthError(null);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'palette://auth/callback',
      },
    });

    if (!error && data?.user?.id) {
      const curatorNameValue = options?.curatorName?.trim() || '';

      // Update the profiles row with curator name
      if (curatorNameValue) {
        await supabase
          .from('profiles')
          .update({ curator_name: curatorNameValue, updated_at: new Date().toISOString() })
          .eq('id', data.user.id);

        storage.set(`curator_name_${data.user.id}`, curatorNameValue);
        setCuratorName(curatorNameValue);
      }
    }

    return { error };
  };

  const signInWithOAuth = async (provider: 'apple' | 'google') => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'palette://auth/callback',
        skipBrowserRedirect: true,
      },
    });

    if (error) return { error };

    if (data?.url) {
      await Linking.openURL(data.url);
    }

    return { error: null };
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'palette://auth/callback',
    });
    return { error };
  };

  const deleteAccount = async () => {
    setAuthError(null);

    if (!user?.id) return { error: { message: 'Not authenticated' } };

    // Delete all user data via RPC (handles cascade in the correct order)
    const { error } = await supabase.rpc('delete_user');

    if (error) {
      // Fallback: manually delete what we can, then sign out
      await supabase.from('user_painting_likes').delete().eq('user_id', user.id);
      await supabase.from('user_collection').delete().eq('user_id', user.id);
      await supabase.from('user_palette').delete().eq('user_id', user.id);
      await supabase.from('visits').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
    }

    await signOut();
    return { error: null };
  };

  const updateProfile = async (updates: { curatorName?: string }) => {
    if (!user?.id) return { error: { message: 'Not authenticated' } };

    if (updates.curatorName !== undefined) {
      const trimmed = updates.curatorName.trim();
      storage.set(`curator_name_${user.id}`, trimmed);
      setCuratorName(trimmed);

      const { error } = await supabase
        .from('profiles')
        .update({ curator_name: trimmed, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      return { error };
    }

    return { error: null };
  };

  const uploadAvatar = async (uri: string): Promise<{ url: string | null; error: any }> => {
    if (!user?.id) return { url: null, error: { message: 'Not authenticated' } };

    try {
      const fileName = `${user.id}/avatar.jpg`;

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileData, {
          upsert: true,
          contentType: 'image/jpeg',
        });

      if (uploadError) return { url: null, error: uploadError };

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      storage.set(`avatar_url_${user.id}`, publicUrl);
      setAvatarUrl(publicUrl);

      return { url: publicUrl, error: null };
    } catch (err: any) {
      return { url: null, error: { message: err?.message || 'Upload failed' } };
    }
  };

  const signOut = async () => {
    setAuthError(null);
    await supabase.auth.signOut();
    offlineQueue.clear();
    storage.delete('sync_last_sync_at');
    storage.delete('sync_collection_updated_at');
    setCuratorName('');
    setAvatarUrl(null);
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
        signInWithOAuth,
        signOut,
        resetPassword,
        deleteAccount,
        updateProfile,
        uploadAvatar,
        curatorName,
        avatarUrl,
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
