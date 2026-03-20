import { StyleSheet } from 'react-native';
import { COLORS, SPACING, GRID } from '@/constants';

export const canonPaletteStyles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.background,
  },

  backButton: {
    marginBottom: SPACING.md,
  },

  subtitle: {
    fontSize: 16,
    color: COLORS.gold,
    fontWeight: '600',
    marginTop: SPACING.xs,
    letterSpacing: 1,
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },

  emptyIcon: {
    fontSize: 64,
  },

  cardWrapper: {
    position: 'relative',
    borderWidth: 3,
    borderColor: 'transparent',
    borderRadius: 8,
    flex: 1 / GRID.columns,
    marginHorizontal: GRID.gutter / 2,
    marginBottom: GRID.gutter,
  },

  cardSelected: {
    borderColor: COLORS.gold,
  },

  checkmark: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkmarkText: {
    fontSize: 18,
    color: COLORS.black,
    fontWeight: '700',
  },

  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  buttonDisabled: {
    opacity: 0.5,
  },
});
