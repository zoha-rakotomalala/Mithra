import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { emptyStateStyles as styles } from './EmptyState.styles';

type EmptyStateProps = {
  readonly icon: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: { label: string; onPress: () => void };
};

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {action ? (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={action.onPress}
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
