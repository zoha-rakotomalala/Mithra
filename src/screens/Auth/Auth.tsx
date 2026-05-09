import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { shared, typography, buttons } from '@/styles';
import { COLORS } from '@/constants';
import { authStyles } from './Auth.styles';

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword';

export function Auth() {
  const { signIn, signUp, signInWithOAuth, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [curatorName, setCuratorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signIn');

  const handleEmailAuth = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (mode === 'forgotPassword') {
      setLoading(true);
      try {
        const { error } = await resetPassword(email.trim());
        if (error) {
          Alert.alert('Error', error.message);
        } else {
          Alert.alert(
            'Check Your Email',
            'A password reset link has been sent to your email.',
            [{ text: 'OK', onPress: () => setMode('signIn') }],
          );
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    if (mode === 'signUp' && password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } =
        mode === 'signUp'
          ? await signUp(email.trim(), password, { curatorName: curatorName.trim() || undefined })
          : await signIn(email.trim(), password);

      if (error) {
        Alert.alert(
          mode === 'signUp' ? 'Sign Up Failed' : 'Sign In Failed',
          error.message,
        );
      } else if (mode === 'signUp') {
        Alert.alert(
          'Check Your Email',
          'A confirmation link has been sent. Please verify your email address to continue.',
        );
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'apple' | 'google') => {
    setLoading(true);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        Alert.alert('Error', error.message);
      }
    } catch {
      Alert.alert('Error', 'Failed to open sign-in page');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signUp':
        return 'CREATE ACCOUNT';
      case 'forgotPassword':
        return 'RESET PASSWORD';
      default:
        return 'WELCOME BACK';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signUp':
        return 'Start curating your personal gallery';
      case 'forgotPassword':
        return 'Enter your email to receive a reset link';
      default:
        return 'Sign in to access your archive';
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={[shared.container, shared.centered, authStyles.container]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[typography.h1, authStyles.title]}>{getTitle()}</Text>
        <View style={shared.artDecoDivider} />
        <Text style={[typography.body, authStyles.subtitle]}>{getSubtitle()}</Text>

        <View style={authStyles.formContainer}>
          <TextInput
            style={authStyles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.black + '80'}
            onChangeText={setEmail}
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            accessibilityLabel="Email address"
          />

          {mode === 'signUp' && (
            <TextInput
              style={authStyles.input}
              placeholder="Curator Name (how others see you)"
              placeholderTextColor={COLORS.black + '80'}
              onChangeText={setCuratorName}
              value={curatorName}
              autoCapitalize="words"
              autoCorrect={false}
              accessibilityLabel="Curator name"
            />
          )}

          {mode !== 'forgotPassword' && (
            <TextInput
              style={authStyles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.black + '80'}
              onChangeText={setPassword}
              value={password}
              secureTextEntry
              autoComplete={mode === 'signUp' ? 'new-password' : 'password'}
              accessibilityLabel="Password"
            />
          )}

          <TouchableOpacity
            style={[buttons.primary, loading && buttons.disabled]}
            onPress={handleEmailAuth}
            disabled={loading || !email.trim()}
            accessibilityRole="button"
            accessibilityLabel={
              mode === 'forgotPassword'
                ? 'Send reset link'
                : mode === 'signUp'
                  ? 'Create account'
                  : 'Sign in'
            }
          >
            {loading ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <Text style={buttons.primaryText}>
                {mode === 'forgotPassword'
                  ? 'SEND RESET LINK'
                  : mode === 'signUp'
                    ? 'SIGN UP'
                    : 'SIGN IN'}
              </Text>
            )}
          </TouchableOpacity>

          {mode === 'signIn' && (
            <TouchableOpacity
              style={authStyles.switchButton}
              onPress={() => setMode('forgotPassword')}
              accessibilityRole="button"
            >
              <Text style={authStyles.switchText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          {mode !== 'forgotPassword' && (
            <>
              <View style={authStyles.dividerRow}>
                <View style={authStyles.dividerLine} />
                <Text style={authStyles.dividerText}>OR</Text>
                <View style={authStyles.dividerLine} />
              </View>

              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={authStyles.oauthButton}
                  onPress={() => handleOAuth('apple')}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Apple"
                >
                  <Text style={authStyles.oauthButtonText}>
                    Continue with Apple
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={authStyles.oauthButton}
                onPress={() => handleOAuth('google')}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
              >
                <Text style={authStyles.oauthButtonText}>
                  Continue with Google
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={authStyles.switchButton}
            onPress={() =>
              setMode(
                mode === 'signUp'
                  ? 'signIn'
                  : mode === 'forgotPassword'
                    ? 'signIn'
                    : 'signUp',
              )
            }
            accessibilityRole="button"
          >
            <Text style={authStyles.switchText}>
              {mode === 'signUp'
                ? 'Already have an account? Sign In'
                : mode === 'forgotPassword'
                  ? 'Back to Sign In'
                  : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
