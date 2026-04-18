import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

/**
 * Shared Common Styles
 * Reusable patterns across the app
 */

export const shared = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  containerDark: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },

  // Centered content
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Padding
  paddingHorizontal: {
    paddingHorizontal: SPACING.lg,
  },
  paddingVertical: {
    paddingVertical: SPACING.md,
  },
  padding: {
    padding: SPACING.md,
  },

  // Shadows (Art Deco subtle shadows)
  shadowLight: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shadowMedium: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  // Borders
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  // Art Deco divider
  artDecoDivider: {
    height: 1,
    backgroundColor: COLORS.gold,
    marginVertical: SPACING.md,
  },

  // Flex helpers
  row: {
    flexDirection: 'row',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Gaps
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  gap16: { gap: 16 },
  gap24: { gap: 24 },
});
