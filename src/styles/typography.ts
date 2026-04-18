import { StyleSheet } from 'react-native';
import { COLORS } from '@/constants';

/**
 * Art Deco Typography Styles
 * Geometric, bold, elegant letterforms
 */

export const typography = StyleSheet.create({
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Body text
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.text,
    lineHeight: 20,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.text,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.textLight,
    lineHeight: 18,
  },

  // Special styles
  caption: {
    fontSize: 11,
    fontWeight: '400',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Art Deco specific
  artDecoTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  artDecoSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textLight,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
