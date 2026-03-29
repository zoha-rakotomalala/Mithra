import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

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
