import { StyleSheet } from 'react-native';
import { COLORS } from '@/constants';

export const backButtonStyles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
  },

  backText: {
    fontSize: 32,
    color: COLORS.text,
    fontWeight: '300',
  },
});
