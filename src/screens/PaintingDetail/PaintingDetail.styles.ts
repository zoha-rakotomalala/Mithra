import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

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
    paddingBottom: 40, // Extra padding for Android nav bar
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
    paddingTop: 50,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  backText: {
    color: COLORS.gold,
    fontSize: 28,
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
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    opacity: 0.3,
    width: 36,
  },
  actionButtonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
    opacity: 1,
  },
  actionText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 14,
    textAlign: 'center',
  },
  actionTextActive: {
    color: COLORS.black,
  },
  dividerVertical: {
    backgroundColor: COLORS.gold,
    height: 24,
    marginHorizontal: 4,
    opacity: 0.3,
    width: 1,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  deleteText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 28,
    marginTop: -4,
    textAlign: 'center',
  },

  /* Gallery Section */
  gallerySection: {
    backgroundColor: COLORS.black,
    paddingHorizontal: SPACING.md + 4,
    paddingVertical: 40,
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
    fontSize: 14,
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
    fontSize: 16,
    marginBottom: SPACING.sm,
  },
  errorSubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  placeholderImage: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: '100%',
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
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
    fontSize: 16,
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
    fontSize: 12,
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
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
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
    fontSize: 14,
    fontStyle: 'italic',
  },
  artist: {
    color: COLORS.text,
    fontSize: 16,
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
  year: {
    color: COLORS.gray500,
    fontSize: 14,
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
    paddingVertical: 6,
  },
  tagWant: {
    backgroundColor: COLORS.warning + '20',
    borderColor: '#cd7f32',
  },
  tagPalette: {
    backgroundColor: COLORS.gold + '20',
    borderColor: COLORS.gold,
  },
  tagText: {
    color: COLORS.text,
    fontSize: 10,
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
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: SPACING.md,
  },
  description: {
    color: COLORS.textLight,
    fontSize: 15,
    lineHeight: 24,
  },
  detailRow: {
    marginBottom: SPACING.sm + 4,
  },
  label: {
    color: COLORS.gray500,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    color: COLORS.text,
    fontSize: 15,
  },
  museum: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  location: {
    color: COLORS.textLight,
    fontSize: 14,
  },

  visitProvenance: {
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },

  visitProvenanceRow: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 8,
    padding: SPACING.sm,
  },

  visitProvenanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.gold,
    textTransform: 'uppercase',
  },

  visitProvenanceValue: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 2,
  },
});