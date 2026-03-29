import { StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const modalHeaderStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 65 : 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.black,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  },
  closeButton: {
    fontSize: 28,
    color: COLORS.gold,
    fontWeight: '300',
    lineHeight: 28,
  },
});
