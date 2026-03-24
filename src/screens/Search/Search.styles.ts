import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS, SPACING, CARD } from '@/constants';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 3; // 3 columns with proper padding

export const searchStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.black, // Black at top for header
    paddingTop: Platform.OS === 'android' ? 25 : 0, // Fix Android notch overlap
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.cream, // Cream for content area
  },

  // Header - Art Deco Black & Gold
  header: {
    backgroundColor: COLORS.black,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 4,
    color: COLORS.gold,
    textTransform: 'uppercase',
  },

  headerSpinner: {
    marginLeft: 'auto',
  },

  newBadge: {
    backgroundColor: COLORS.seen,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: SPACING.sm,
  },

  newBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
  },

  // Search Type Row
  searchTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },

  searchTypeLabel: {
    fontSize: 11,
    color: 'rgba(212, 175, 55, 0.7)',
    marginRight: SPACING.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  searchTypeButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  searchTypeButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    backgroundColor: 'transparent',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
  },

  searchTypeButtonActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },

  searchTypeButtonText: {
    fontSize: 11,
    color: 'rgba(212, 175, 55, 0.7)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  searchTypeButtonTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
    letterSpacing: 1,
  },

  // Search Bar
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },

  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    paddingHorizontal: SPACING.sm,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },

  searchIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.cream,
    padding: 0,
  },

  clearButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearButtonText: {
    fontSize: 24,
    color: 'rgba(212, 175, 55, 0.5)',
    lineHeight: 28,
  },

  searchButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchButtonText: {
    fontSize: 24,
    color: COLORS.black,
    fontWeight: 'bold',
  },

  searchButtonDisabled: {
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },

  // Museum Selector Button
  museumSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },

  museumSelectContent: {
    flex: 1,
  },

  museumSelectLabel: {
    fontSize: 10,
    color: 'rgba(212, 175, 55, 0.7)',
    marginBottom: 2,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  museumSelectValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gold,
    letterSpacing: 0.5,
  },

  museumSelectIcon: {
    fontSize: 12,
    color: 'rgba(212, 175, 55, 0.7)',
    marginLeft: SPACING.sm,
  },

  // Modal
  modalSafeArea: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.black,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 3,
    color: COLORS.gold,
    textTransform: 'uppercase',
  },

  modalDoneButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
  },

  modalDoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Centered Grid Container
  gridContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: 20,
  },

  gridRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },

  // Result Cards
  resultCard: {
    width: CARD_SIZE,
    marginBottom: SPACING.md,
  },

  imageContainer: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    marginBottom: 6,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },

  resultImage: {
    width: '100%',
    height: '100%',
  },

  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderIcon: {
    fontSize: 32,
  },

  statusBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    gap: 4,
  },

  badgeTextSeen: {
    backgroundColor: 'rgba(230, 57, 70, 0.95)',
    color: COLORS.textInverse,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  badgeTextWant: {
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    color: COLORS.textInverse,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  museumBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },

  museumBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textInverse,
    letterSpacing: 0.5,
  },

  likeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  likeButtonText: {
    fontSize: 14,
  },

  resultTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
    lineHeight: 16,
  },

  resultArtist: {
    fontSize: 10,
    fontStyle: 'italic',
    color: COLORS.textLight,
    marginBottom: 2,
  },

  resultYear: {
    fontSize: 9,
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },

  // Empty State
  emptyState: {
    paddingTop: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  popularTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
    letterSpacing: 1,
  },

  artistChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },

  artistChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cream,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },

  artistChipText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  emptyHint: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  loadingContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },

  loadingText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    letterSpacing: 0.5,
  },
});