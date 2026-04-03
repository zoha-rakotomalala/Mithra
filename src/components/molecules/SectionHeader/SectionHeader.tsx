import React from 'react';
import { View, Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { sectionHeaderStyles as styles } from './SectionHeader.styles';

export type SectionHeaderProps = {
  readonly title: string;
  readonly icon?: string;
  readonly titleStyle?: StyleProp<TextStyle>;
};

export function SectionHeader({ title, icon, titleStyle }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.divider} />
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <View style={styles.divider} />
    </View>
  );
}
