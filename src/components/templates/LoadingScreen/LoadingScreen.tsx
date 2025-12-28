import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Palette</Text>
      <View style={styles.brushStroke} />
      <ActivityIndicator
        size="large"
        color="#2d6a4f"
        style={styles.loader}
      />
      <Text style={styles.subtitle}>Loading your collection...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: 2,
    color: '#1a4d3e',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  brushStroke: {
    width: 120,
    height: 3,
    backgroundColor: '#2d6a4f',
    borderRadius: 2,
    opacity: 0.6,
    marginBottom: 40,
  },
  loader: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    letterSpacing: 1,
  },
});