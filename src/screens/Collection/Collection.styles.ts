import { Dimensions, StyleSheet } from 'react-native';
import {
  COLORS,
  SPACING,
  ANDROID_STATUS_BAR_PADDING,
  FONT_SIZE,
  BORDER_RADIUS,
  ICON_SIZE,
} from '@/constants';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 64) / 3;

/**
 * Collection Screen Styles
 * Art Deco styling harmonized with Search screen
 */

export const collectionStyles = StyleSheet.create({
  /* Safe Area - Matches Search */
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.black,
    paddingTop: ANDROID_STATUS_BAR_PADDING,
  },

  container: {
    backgroundColor: COLORS.cream,
    flex: 1,
  },

  /* Header - Compact like Search */
  header: {
    backgroundColor: COLORS.black,
    borderBottomColor: COLORS.gold,
    borderBottomWidth: 2,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE['5xl'],
    fontWeight: '300',
    letterSpacing: 4,
    color: COLORS.gold,
    textTransform: 'uppercase',
  },

  /* Compact Stats - Inline */
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.black,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
  },
  statCompact: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  statNumber: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '600',
    color: COLORS.gold,
  },
  seenNumber: {
    color: COLORS.danger,
  },
  wantNumber: {
    color: COLORS.amber,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(212, 175, 55, 0.5)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statDivider: {
    fontSize: FONT_SIZE.lg,
    color: 'rgba(212, 175, 55, 0.3)',
  },

  /* Filters - Matches Search button style */
  filtersSection: {
    backgroundColor: COLORS.cream,
    borderBottomColor: COLORS.gray200,
    borderBottomWidth: 1,
    paddingVertical: SPACING.md,
  },
  filtersContent: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  filterChip: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(212, 175, 55, 0.5)',
    borderRadius: 2,
    borderWidth: 1,
    marginRight: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  filterChipText: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(212, 175, 55, 0.7)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  filterChipTextActive: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.black,
    letterSpacing: 1,
  },

  /* Sort Options */
  sortContainer: {
    backgroundColor: COLORS.cream,
    borderBottomColor: COLORS.gray200,
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  sortOptions: {
    gap: SPACING.sm,
  },
  sortOption: {
    backgroundColor: 'transparent',
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    borderRadius: 2,
    marginRight: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  sortOptionActive: {
    borderBottomColor: COLORS.gold,
  },
  sortOptionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sortOptionTextActive: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '700',
    letterSpacing: 1,
  },

  /* Empty State */
  emptyState: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: FONT_SIZE.display,
    marginBottom: SPACING.md,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: FONT_SIZE['3xl'],
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.body,
    color: COLORS.textLight,
    lineHeight: FONT_SIZE['3xl'],
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  /* Grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  gridItem: {
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.xs,
    width: CARD_SIZE,
  },

  /* Grouped View */
  groupSection: {
    marginBottom: SPACING.lg,
  },
  groupHeader: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 77, 64, 0.05)',
    borderLeftColor: COLORS.gold,
    borderLeftWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  groupTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  groupCount: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textLight,
    letterSpacing: 1,
  },
  horizontalList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  /* Painting Card - Matches Search result cards */
  paintingCard: {
    aspectRatio: 0.75,
    backgroundColor: COLORS.surface,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 2,
    borderWidth: 2,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: COLORS.black,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
  },
  paintingImage: {
    height: '100%',
    width: '100%',
  },
  paintingPlaceholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  artFrame: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    borderWidth: 2,
    height: '80%',
    justifyContent: 'center',
    width: '80%',
  },
  paintingIcon: {
    fontSize: ICON_SIZE['3xl'],
    opacity: 0.9,
  },
  paintingTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: FONT_SIZE['2xl'],
    marginTop: SPACING.sm,
  },
  paintingArtist: {
    fontSize: FONT_SIZE.xs,
    fontStyle: 'italic',
    color: COLORS.textLight,
    marginTop: 2,
  },
  paintingYear: {
    fontSize: FONT_SIZE.xxs,
    color: COLORS.textLight,
    letterSpacing: 0.5,
    marginTop: 2,
  },

  /* Badges - Matches Search badges */
  seenBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(230, 57, 70, 0.95)',
    borderRadius: BORDER_RADIUS.sm,
    elevation: 4,
    height: ICON_SIZE.md,
    justifyContent: 'center',
    position: 'absolute',
    right: SPACING.sm - 2,
    shadowColor: COLORS.black,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    top: SPACING.sm - 2,
    width: ICON_SIZE.md,
  },
  wantToVisitBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    borderRadius: BORDER_RADIUS.sm,
    elevation: 4,
    height: ICON_SIZE.md,
    justifyContent: 'center',
    position: 'absolute',
    right: SPACING.sm - 2,
    shadowColor: COLORS.black,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    top: SPACING.sm - 2,
    width: ICON_SIZE.md,
  },
  badgeIcon: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textInverse,
    lineHeight: FONT_SIZE.xs,
    textAlign: 'center',
  },
});
