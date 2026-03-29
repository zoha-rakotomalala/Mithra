import { Dimensions, StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING } from '@/constants';

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
    paddingTop: Platform.OS === 'android' ? 25 : 0, // Fix Android notch overlap
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
    fontSize: 28,
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
    gap: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gold,
  },
  seenNumber: {
    color: '#e63946',
  },
  wantNumber: {
    color: '#f59e0b',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(212, 175, 55, 0.5)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statDivider: {
    fontSize: 14,
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
    fontSize: 11,
    color: 'rgba(212, 175, 55, 0.7)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  filterChipTextActive: {
    fontSize: 11,
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
    fontSize: 11,
    color: COLORS.textLight,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sortOptionTextActive: {
    fontSize: 11,
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
    fontSize: 64,
    marginBottom: SPACING.md,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
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
    marginHorizontal: 4,
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
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  groupCount: {
    fontSize: 12,
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
    fontSize: 40,
    opacity: 0.9,
  },
  paintingTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 16,
    marginTop: SPACING.sm,
  },
  paintingArtist: {
    fontSize: 10,
    fontStyle: 'italic',
    color: COLORS.textLight,
    marginTop: 2,
  },
  paintingYear: {
    fontSize: 9,
    color: COLORS.textLight,
    letterSpacing: 0.5,
    marginTop: 2,
  },

  /* Badges - Matches Search badges */
  seenBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(230, 57, 70, 0.95)',
    borderRadius: 4,
    elevation: 4,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    shadowColor: COLORS.black,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    top: 6,
    width: 20,
  },
  wantToVisitBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    borderRadius: 4,
    elevation: 4,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    shadowColor: COLORS.black,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    top: 6,
    width: 20,
  },
  badgeIcon: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textInverse,
    lineHeight: 10,
    textAlign: 'center',
  },
});