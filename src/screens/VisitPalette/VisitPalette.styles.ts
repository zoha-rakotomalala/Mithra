import { StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const visitPaletteStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.black,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },

  header: {
    backgroundColor: COLORS.black,
    borderBottomColor: COLORS.gold,
    borderBottomWidth: 2,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    marginRight: SPACING.sm,
  },

  backText: {
    fontSize: 24,
    color: COLORS.gold,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 4,
    color: COLORS.gold,
    textTransform: 'uppercase',
    flexShrink: 1,
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
