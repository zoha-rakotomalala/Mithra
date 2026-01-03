import { StyleSheet } from 'react-native';
import { COLORS, CARD, SPACING } from '@/constants';

/**
 * Card Styles
 * Grid painting cards with Art Deco aesthetic
 */

export const cards = StyleSheet.create({
  // Grid card container
  gridCard: {
    width: CARD.gridWidth,
    marginBottom: SPACING.md,
  },
  
  // Image container with Art Deco frame
  imageContainer: {
    width: CARD.gridWidth,
    height: CARD.gridHeight,
    borderRadius: CARD.borderRadius,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    // Art Deco border effect
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  
  // Image
  image: {
    width: '100%',
    height: '100%',
  },
  
  // Placeholder for missing images
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray200,
  },
  imagePlaceholderIcon: {
    fontSize: 32,
  },
  
  // Loading overlay
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Card text content
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.xs,
    lineHeight: 16,
  },
  cardArtist: {
    fontSize: 11,
    fontWeight: '400',
    color: COLORS.textLight,
    marginTop: 2,
  },
  cardYear: {
    fontSize: 10,
    fontWeight: '400',
    color: COLORS.textLight,
    marginTop: 2,
  },
  
  // Art Deco decorative elements
  artDecoCorner: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderColor: COLORS.gold,
  },
  artDecoCornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  artDecoCornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  artDecoCornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  artDecoCornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
});
