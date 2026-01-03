import { Dimensions, StyleSheet } from 'react-native';
import { COLORS, SPACING, CARD } from '@/constants';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 3;

/**
 * Search Screen Styles
 * Art Deco styling for museum search interface
 */

export const searchStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cream,
    flex: 1,
  },

  /* Header */
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.black,
    borderBottomColor: COLORS.gold,
    borderBottomWidth: 2,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
  },
  headerTitle: {
    color: COLORS.gold,
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 4,
    marginBottom: SPACING.sm + 4,
  },
  headerDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: SPACING.sm + 4,
    width: '60%',
  },
  headerSubtitle: {
    color: COLORS.gold,
    fontSize: 10,
    letterSpacing: 2,
    opacity: 0.7,
  },
  dividerLine: {
    backgroundColor: COLORS.gold,
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
  dividerOrnament: {
    color: COLORS.gold,
    fontSize: 12,
    marginHorizontal: SPACING.sm + 4,
  },

  /* Filter Section */
  filterSection: {
    backgroundColor: COLORS.background,
    borderBottomColor: COLORS.gray200,
    borderBottomWidth: 1,
    padding: SPACING.md,
  },
  selectMuseumsButton: {
    backgroundColor: COLORS.cream,
    borderColor: COLORS.text,
    borderRadius: 4,
    borderWidth: 2,
    overflow: 'hidden',
  },
  selectMuseumsButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  selectMuseumsLabel: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  selectMuseumsText: {
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: '600',
  },
  selectMuseumsIcon: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },

  /* Search Section */
  searchSection: {
    backgroundColor: COLORS.cream,
    borderBottomColor: COLORS.gray200,
    borderBottomWidth: 1,
    padding: SPACING.md + 4,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderColor: COLORS.text,
    borderRadius: 2,
    borderWidth: 2,
    flexDirection: 'row',
    marginBottom: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
  },
  searchInput: {
    color: COLORS.text,
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    color: COLORS.gray500,
    fontSize: 24,
    fontWeight: '300',
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: COLORS.text,
    borderColor: COLORS.gold,
    borderRadius: 2,
    borderWidth: 2,
    padding: 14,
  },
  searchButtonDisabled: {
    backgroundColor: COLORS.gray300,
    borderColor: COLORS.gray500,
  },
  searchButtonText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },

  /* Modal */
  modalContainer: {
    backgroundColor: COLORS.cream,
    flex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.black,
    borderBottomColor: COLORS.gold,
    borderBottomWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md + 4,
    paddingTop: 60,
  },
  modalTitle: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 2,
  },
  modalDoneButton: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.gold,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  modalDoneText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },

  /* Content */
  flatListContent: {
    paddingHorizontal: SPACING.md,
  },

  /* Empty State */
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
    opacity: 0.5,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: SPACING.sm + 4,
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  /* Popular Section */
  popularSection: {
    paddingVertical: SPACING.md + 4,
  },
  sectionDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: SPACING.sm + 4,
  },
  artistChips: {
    gap: SPACING.sm,
    paddingRight: SPACING.md + 4,
  },
  artistChip: {
    backgroundColor: 'transparent',
    borderColor: COLORS.text,
    borderRadius: 2,
    borderWidth: 1,
    marginRight: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  artistChipText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  /* Info Banner */
  infoBanner: {
    backgroundColor: 'rgba(0, 77, 64, 0.05)',
    borderLeftColor: COLORS.gold,
    borderLeftWidth: 4,
    borderRadius: 2,
    marginBottom: SPACING.md + 4,
    padding: SPACING.md + 4,
  },
  infoBannerTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  infoBannerText: {
    color: COLORS.textLight,
    fontSize: 13,
    lineHeight: 20,
  },

  /* Loading */
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: SPACING.md,
  },

  /* Results */
  resultsHeader: {
    marginBottom: SPACING.md,
  },
  resultsTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: SPACING.sm + 4,
  },

  /* Grid Items */
  resultCard: {
    marginBottom: SPACING.md + 4,
    padding: 4,
    width: CARD_SIZE,
  },
  imageContainer: {
    marginBottom: SPACING.sm,
    position: 'relative',
  },
  resultImage: {
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 2,
    borderWidth: 2,
    width: '100%',
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    justifyContent: 'center',
    zIndex: 10,
  },
  placeholderImage: {
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: 2,
    justifyContent: 'center',
    width: '100%',
  },
  placeholderIcon: {
    fontSize: 40,
  },

  /* Badges */
  statusBadge: {
    flexDirection: 'row',
    gap: 4,
    position: 'absolute',
    right: SPACING.sm,
    top: SPACING.sm,
  },
  badgeTextSeen: {
    backgroundColor: 'rgba(230, 57, 70, 0.95)',
    borderRadius: 12,
    color: COLORS.textInverse,
    fontSize: 12,
    fontWeight: '700',
    height: 24,
    lineHeight: 24,
    textAlign: 'center',
    width: 24,
  },
  badgeTextWant: {
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    borderRadius: 12,
    color: COLORS.textInverse,
    fontSize: 12,
    fontWeight: '700',
    height: 24,
    lineHeight: 24,
    textAlign: 'center',
    width: 24,
  },
  museumBadge: {
    borderRadius: 2,
    left: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    position: 'absolute',
    top: SPACING.sm,
  },
  museumBadgeText: {
    color: COLORS.textInverse,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },

  /* Card Text */
  resultTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 4,
  },
  resultArtist: {
    color: COLORS.textLight,
    fontSize: 10,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  resultYear: {
    color: COLORS.gray500,
    fontSize: 9,
    letterSpacing: 0.5,
  },
});