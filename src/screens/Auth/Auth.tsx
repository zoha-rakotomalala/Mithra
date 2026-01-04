import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { shared, typography, buttons } from '@/styles';
import { COLORS, SPACING } from '@/constants';
import { authStyles } from './Auth.styles';

export function Auth() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const { error } = isSigningUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        Alert.alert(
          isSigningUp ? 'Sign Up Failed' : 'Sign In Failed',
          error.message
        );
      } else if (isSigningUp) {
        Alert.alert(
          'Check Your Email',
          'A confirmation link has been sent to your email. Please verify your address.'
        );
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[shared.container, shared.centered, authStyles.container]}>
      <Text style={[typography.h1, authStyles.title]}>
        {isSigningUp ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
      </Text>

      <View style={shared.artDecoDivider} />

      <Text style={[typography.body, authStyles.subtitle]}>
        {isSigningUp ? 'Start tracking your visits' : 'Sign in to access your archive'}
      </Text>

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
        />

        <TextInput
          style={authStyles.input}
          placeholder="Password"
          placeholderTextColor={COLORS.black + '80'}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity
          style={[buttons.primary, loading && buttons.disabled]}
          onPress={handleAuth}
          disabled={loading || !email.trim() || !password.trim()}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.black} />
          ) : (
            <Text style={buttons.primaryText}>
              {isSigningUp ? 'SIGN UP' : 'SIGN IN'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={authStyles.switchButton}
          onPress={() => setIsSigningUp(!isSigningUp)}
        >
          <Text style={authStyles.switchText}>
            {isSigningUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"
            }
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

