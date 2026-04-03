import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

/**
 * Button Styles
 * Art Deco-inspired buttons
 */

export const buttons = StyleSheet.create({
  // Primary button (gold)
  primary: {
    backgroundColor: COLORS.gold,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  
  // Secondary button (outlined)
  secondary: {
    backgroundColor: 'transparent',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  
  // Icon button
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Small button
  small: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 4,
  },
  smallText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Disabled state
  disabled: {
    opacity: 0.5,
  },
});
