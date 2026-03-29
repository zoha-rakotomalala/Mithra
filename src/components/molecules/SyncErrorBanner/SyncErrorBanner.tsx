import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

interface SyncErrorBannerProps {
  readonly error: string | null;
}

export function SyncErrorBanner({ error }: SyncErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when a new error comes in
  useEffect(() => {
    if (error) {
      setDismissed(false);
    }
  }, [error]);

  if (!error || dismissed) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.message} numberOfLines={2}>
        {error}
      </Text>
      <TouchableOpacity
        onPress={() => setDismissed(true)}
        style={styles.dismissButton}
        accessibilityRole="button"
        accessibilityLabel="Dismiss sync error"
      >
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xs,
    borderRadius: 6,
  },
  message: {
    color: COLORS.textInverse,
    fontSize: 13,
    flex: 1,
  },
  dismissButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  dismissText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
