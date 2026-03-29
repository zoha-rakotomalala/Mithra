import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { modalHeaderStyles as styles } from './ModalHeader.styles';

type ModalHeaderProps = {
  readonly title: string;
  readonly onClose: () => void;
  readonly titleStyle?: StyleProp<TextStyle>;
  readonly style?: StyleProp<ViewStyle>;
  readonly closeButtonStyle?: StyleProp<TextStyle>;
};

export function ModalHeader({
  title,
  onClose,
  titleStyle,
  style,
  closeButtonStyle,
}: ModalHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={titleStyle}>{title}</Text>
      <TouchableOpacity
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Text style={[styles.closeButton, closeButtonStyle]}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}
