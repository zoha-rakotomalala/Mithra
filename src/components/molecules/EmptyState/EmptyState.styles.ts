import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const emptyStateStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.lg,
  },
  icon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
    opacity: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  actionButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
