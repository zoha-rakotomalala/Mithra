import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

/** Padding to avoid Android status bar/notch overlap */
export const ANDROID_STATUS_BAR_PADDING = Platform.OS === 'android' ? 25 : 0;

/**
 * Art Deco-inspired spacing system
 * Based on geometric proportions and golden ratio
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Grid system for painting cards
 */
export const GRID = {
  columns: 3,
  gutter: SPACING.md,
  margin: SPACING.lg,
} as const;

/**
 * Card dimensions
 */
export const CARD = {
  // Grid card (3 columns)
  gridWidth: (width - GRID.margin * 2 - GRID.gutter * 2) / GRID.columns,
  get gridHeight() {
    return this.gridWidth * 1.3; // Art Deco proportion
  },

  // Detail card
  detailMaxWidth: width - SPACING.xl * 2,

  // Border radius
  borderRadius: 8,
  borderRadiusLarge: 16,
} as const;

/**
 * Badge dimensions
 */
export const BADGE = {
  size: 24,
  iconSize: 12,
  borderRadius: 12,
  museumHeight: 20,
  museumPadding: 6,
} as const;

/**
 * Screen dimensions
 */
export const SCREEN = {
  width,
  height,
} as const;

/**
 * Art Deco geometric proportions
 */
export const PROPORTIONS = {
  golden: 1.618,
  artDeco: 1.3, // Typical Art Deco height ratio
} as const;

/**
 * Font size scale
 */
export const FONT_SIZE = {
  xxs: 9,
  xs: 10,
  sm: 11,
  md: 12,
  body: 13,
  lg: 14,
  xl: 15,
  '2xl': 16,
  '3xl': 20,
  '4xl': 24,
  '5xl': 28,
  '6xl': 32,
  display: 64,
} as const;

/**
 * Border radius scale
 */
export const BORDER_RADIUS = {
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
  '2xl': 14,
  round: 18,
} as const;

/**
 * Icon size scale
 */
export const ICON_SIZE = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
  '3xl': 40,
  '4xl': 44,
} as const;

/**
 * Touchable / interactive element heights
 */
export const TOUCHABLE_HEIGHT = {
  sm: 28,
  md: 36,
  lg: 44,
  xl: 56,
} as const;

/**
 * Hit slop for touch targets
 */
export const HIT_SLOP = {
  sm: { top: 4, bottom: 4, left: 4, right: 4 },
  md: { top: 8, bottom: 8, left: 8, right: 8 },
  lg: { top: 12, bottom: 12, left: 12, right: 12 },
} as const;

/**
 * Tab bar dimensions
 */
export const TAB_BAR = {
  height: 64,
  minPaddingBottom: 12,
  labelFontSize: 10,
  labelLetterSpacing: 2,
  labelMarginTop: 4,
  iconFontSize: 16,
} as const;
