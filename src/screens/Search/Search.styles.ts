import { StyleSheet, Dimensions } from 'react-native';
import {
  COLORS,
  SPACING,
  ANDROID_STATUS_BAR_PADDING,
  FONT_SIZE,
  BORDER_RADIUS,
  TOUCHABLE_HEIGHT,
} from '@/constants';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 3; // 3 columns with proper padding

export const searchStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.black, // Black at top for header
    paddingTop: ANDROID_STATUS_BAR_PADDING,
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
  },

  backButton: {
    marginRight: SPACING.sm,
    paddingVertical: SPACING.xs,
  },

  backText: {
    fontSize: FONT_SIZE['4xl'],
    color: COLORS.gold,
  },

  headerTitle: {
    fontSize: FONT_SIZE['5xl'],
    fontWeight: '300',
    letterSpacing: 4,
    color: COLORS.gold,
    textTransform: 'uppercase',
  },

  // Search Type Row
  searchTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },

  searchTypeLabel: {
    fontSize: FONT_SIZE.sm,
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
    fontSize: FONT_SIZE.sm,
    color: 'rgba(212, 175, 55, 0.7)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  searchTypeButtonTextActive: {
    fontSize: FONT_SIZE.sm,
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
    height: TOUCHABLE_HEIGHT.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },

  searchIcon: {
    fontSize: FONT_SIZE['2xl'],
    marginRight: SPACING.sm,
  },

  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    color: COLORS.cream,
    padding: 0,
  },

  clearButton: {
    width: TOUCHABLE_HEIGHT.sm,
    height: TOUCHABLE_HEIGHT.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearButtonText: {
    fontSize: FONT_SIZE['4xl'],
    color: 'rgba(212, 175, 55, 0.5)',
    lineHeight: TOUCHABLE_HEIGHT.sm,
  },

  searchButton: {
    width: TOUCHABLE_HEIGHT.lg,
    height: TOUCHABLE_HEIGHT.lg,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchButtonText: {
    fontSize: FONT_SIZE['4xl'],
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
    fontSize: FONT_SIZE.xs,
    color: 'rgba(212, 175, 55, 0.7)',
    marginBottom: 2,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  museumSelectValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.gold,
    letterSpacing: 0.5,
  },

  museumSelectIcon: {
    fontSize: FONT_SIZE.md,
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
    fontSize: FONT_SIZE['4xl'],
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
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.black,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Centered Grid Container
  gridContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg - SPACING.xs,
  },

  gridRow: {
    justifyContent: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
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
    fontSize: FONT_SIZE['6xl'],
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
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    paddingHorizontal: SPACING.sm - 2,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },

  badgeTextWant: {
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    color: COLORS.textInverse,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    paddingHorizontal: SPACING.sm - 2,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },

  museumBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },

  museumBadgeText: {
    fontSize: FONT_SIZE.xxs,
    fontWeight: '700',
    color: COLORS.textInverse,
    letterSpacing: 0.5,
  },

  likeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: TOUCHABLE_HEIGHT.sm,
    height: TOUCHABLE_HEIGHT.sm,
    borderRadius: BORDER_RADIUS['2xl'],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  likeButtonText: {
    fontSize: FONT_SIZE['2xl'],
    color: COLORS.gold,
    fontWeight: '700',
  },

  resultTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
    lineHeight: FONT_SIZE['2xl'],
  },

  resultArtist: {
    fontSize: FONT_SIZE.xs,
    fontStyle: 'italic',
    color: COLORS.textLight,
    marginBottom: 2,
  },

  resultYear: {
    fontSize: FONT_SIZE.xxs,
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
    fontSize: FONT_SIZE['3xl'],
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
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  emptyHint: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  loadingContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },

  loadingText: {
    fontSize: FONT_SIZE.body,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    letterSpacing: 0.5,
  },
});
