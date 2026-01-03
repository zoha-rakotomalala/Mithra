import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Palette</Text>
      <View style={styles.brushStroke} />
      <ActivityIndicator
        color="#2d6a4f"
        size="large"
        style={styles.loader}
      />
      <Text style={styles.subtitle}>Loading your collection...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brushStroke: {
    backgroundColor: '#2d6a4f',
    borderRadius: 2,
    height: 3,
    marginBottom: 40,
    opacity: 0.6,
    width: 120,
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    flex: 1,
    justifyContent: 'center',
  },
  loader: {
    marginBottom: 16,
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
    letterSpacing: 1,
  },
  title: {
    color: '#1a4d3e',
    fontSize: 48,
    fontStyle: 'italic',
    fontWeight: '300',
    letterSpacing: 2,
    marginBottom: 8,
  },
});