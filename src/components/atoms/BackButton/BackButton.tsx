import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { backButtonStyles as styles } from './BackButton.styles';

export type BackButtonProps = {
  readonly onPress: () => void;
  readonly style?: StyleProp<ViewStyle>;
  readonly textStyle?: StyleProp<TextStyle>;
};

export function BackButton({ onPress, style, textStyle }: BackButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.backButton, style]}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Text style={[styles.backText, textStyle]}>←</Text>
    </TouchableOpacity>
  );
}
