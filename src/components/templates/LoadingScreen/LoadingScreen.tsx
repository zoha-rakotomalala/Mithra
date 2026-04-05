import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Palette</Text>
      <View style={styles.brushStroke} />
      <ActivityIndicator
        color={COLORS.primary}
        size="large"
        style={styles.loader}
      />
      <Text style={styles.subtitle}>Loading your collection...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brushStroke: {
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    height: 3,
    marginBottom: 40,
    opacity: 0.6,
    width: 120,
  },
  container: {
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    flex: 1,
    justifyContent: 'center',
  },
  loader: {
    marginBottom: 16,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    letterSpacing: 1,
  },
  title: {
    color: COLORS.primaryDark,
    fontSize: 48,
    fontStyle: 'italic',
    fontWeight: '300',
    letterSpacing: 2,
    marginBottom: 8,
  },
});
