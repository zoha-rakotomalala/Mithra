import { StyleSheet } from 'react-native';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  TOUCHABLE_HEIGHT,
} from '@/constants';

/**
 * Painting Detail Screen Styles
 * Art Deco styling for artwork detail view
 */

export const paintingDetailStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cream,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: SPACING.xl + SPACING.sm, // Extra padding for Android nav bar
  },

  /* Header */
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.black,
    borderBottomColor: COLORS.gold,
    borderBottomWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm + 4,
    paddingHorizontal: SPACING.md + 4,
    paddingTop: SPACING.xxl + 2,
  },
  backButton: {
    alignItems: 'center',
    height: TOUCHABLE_HEIGHT.lg,
    justifyContent: 'center',
    width: TOUCHABLE_HEIGHT.lg,
  },
  backText: {
    color: COLORS.gold,
    fontSize: FONT_SIZE['5xl'],
    fontWeight: '300',
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: COLORS.gold,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    height: TOUCHABLE_HEIGHT.md,
    justifyContent: 'center',
    opacity: 0.3,
    width: TOUCHABLE_HEIGHT.md,
  },
  actionButtonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
    opacity: 1,
  },
  actionText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    lineHeight: FONT_SIZE.lg,
    textAlign: 'center',
  },
  actionTextActive: {
    color: COLORS.black,
  },
  dividerVertical: {
    backgroundColor: COLORS.gold,
    height: SPACING.lg,
    marginHorizontal: SPACING.xs,
    opacity: 0.3,
    width: 1,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.round,
    height: TOUCHABLE_HEIGHT.md,
    justifyContent: 'center',
    width: TOUCHABLE_HEIGHT.md,
  },
  deleteText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: FONT_SIZE['5xl'],
    fontWeight: '300',
    lineHeight: FONT_SIZE['5xl'],
    marginTop: -4,
    textAlign: 'center',
  },

  /* Gallery Section */
  gallerySection: {
    backgroundColor: COLORS.black,
    paddingHorizontal: SPACING.md + 4,
    paddingVertical: SPACING.xl + SPACING.sm,
    position: 'relative',
  },
  image: {
    aspectRatio: 1,
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: '100%',
  },
  loadingText: {
    color: COLORS.gold,
    fontSize: FONT_SIZE.lg,
    letterSpacing: 1,
    marginTop: SPACING.md,
  },
  errorContainer: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: '100%',
  },
  errorText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: FONT_SIZE['2xl'],
    marginBottom: SPACING.sm,
  },
  errorSubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: FONT_SIZE.md,
  },
  placeholderImage: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: '100%',
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: FONT_SIZE.lg,
    letterSpacing: 1,
  },

  /* Art Deco Corners */
  cornerTopLeft: {
    left: SPACING.md + 4,
    position: 'absolute',
    top: SPACING.md + 4,
    zIndex: 10,
  },
  cornerTopRight: {
    position: 'absolute',
    right: SPACING.md + 4,
    top: SPACING.md + 4,
    zIndex: 10,
  },
  cornerBottomLeft: {
    bottom: SPACING.md + 4,
    left: SPACING.md + 4,
    position: 'absolute',
    zIndex: 10,
  },
  cornerBottomRight: {
    bottom: SPACING.md + 4,
    position: 'absolute',
    right: SPACING.md + 4,
    zIndex: 10,
  },
  cornerOrnament: {
    color: COLORS.gold,
    fontSize: FONT_SIZE['2xl'],
    opacity: 0.6,
  },

  /* Quick Add Section */
  quickAddSection: {
    backgroundColor: COLORS.cream,
    padding: SPACING.lg,
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: SPACING.sm + 4,
  },
  artDecoButton: {
    alignItems: 'center',
    backgroundColor: COLORS.text,
    borderColor: COLORS.gold,
    borderRadius: 2,
    borderWidth: 2,
    flex: 1,
    paddingVertical: SPACING.md,
  },
  artDecoButtonSecondary: {
    backgroundColor: 'transparent',
  },
  artDecoButtonText: {
    color: COLORS.gold,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    letterSpacing: 2,
  },
  artDecoButtonTextSecondary: {
    color: COLORS.text,
  },

  /* Info Section */
  infoSection: {
    backgroundColor: COLORS.cream,
    borderBottomColor: COLORS.gold,
    borderBottomWidth: 1,
    padding: SPACING.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZE['5xl'],
    fontWeight: '600',
    lineHeight: TOUCHABLE_HEIGHT.md,
    marginBottom: SPACING.sm + 4,
    textAlign: 'center',
  },
  artistRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  artistLabel: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.lg,
    fontStyle: 'italic',
  },
  artist: {
    color: COLORS.text,
    fontSize: FONT_SIZE['2xl'],
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
  year: {
    color: COLORS.gray500,
    fontSize: FONT_SIZE.lg,
    letterSpacing: 2,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
    marginTop: SPACING.sm + 4,
  },
  tag: {
    backgroundColor: COLORS.success + '20',
    borderColor: COLORS.text,
    borderRadius: 2,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm - 2,
  },
  tagWant: {
    backgroundColor: COLORS.warning + '20',
    borderColor: COLORS.bronze,
  },
  tagPalette: {
    backgroundColor: COLORS.gold + '20',
    borderColor: COLORS.gold,
  },
  tagText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  /* Sections */
  section: {
    backgroundColor: COLORS.cream,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    padding: SPACING.lg,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: SPACING.md + 4,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: SPACING.md,
  },
  description: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.xl,
    lineHeight: SPACING.lg,
  },
  detailRow: {
    marginBottom: SPACING.sm + 4,
  },
  label: {
    color: COLORS.gray500,
    fontSize: FONT_SIZE.sm,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  value: {
    color: COLORS.text,
    fontSize: FONT_SIZE.xl,
  },
  museum: {
    color: COLORS.text,
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  location: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.lg,
  },

  visitProvenance: {
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },

  visitProvenanceRow: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
  },

  visitProvenanceLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.gold,
    textTransform: 'uppercase',
  },

  visitProvenanceValue: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    marginTop: 2,
  },
});
