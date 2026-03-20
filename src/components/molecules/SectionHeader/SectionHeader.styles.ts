import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const sectionHeaderStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  divider: {
    backgroundColor: COLORS.gold,
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  title: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: SPACING.sm,
    textTransform: 'uppercase',
  },
  icon: {
    color: COLORS.gold,
    marginHorizontal: SPACING.xs,
  },
});
