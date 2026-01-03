import { Dimensions, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 64) / 3;

/**
 * Collection Screen Styles
 * Art Deco styling for painting collection grid
 */

export const collectionStyles = StyleSheet.create({
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
    paddingBottom: SPACING.md + 4,
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
    width: '60%',
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

  /* Stats Bar */
  statsBar: {
    alignItems: 'center',
    backgroundColor: COLORS.black,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: COLORS.gold,
    fontSize: 28,
    fontWeight: '300',
  },
  seenNumber: {
    color: '#e63946',
  },
  wantNumber: {
    color: '#f59e0b',
  },
  statLabel: {
    color: 'rgba(212, 175, 55, 0.7)',
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 4,
  },
  statDivider: {
    justifyContent: 'center',
  },
  statDividerText: {
    color: 'rgba(212, 175, 55, 0.3)',
    fontSize: 24,
  },

  /* Filters */
  filtersSection: {
    backgroundColor: COLORS.cream,
    borderBottomColor: COLORS.gray200,
    borderBottomWidth: 1,
    paddingVertical: SPACING.md,
  },
  filtersContent: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md + 4,
  },
  filterChip: {
    backgroundColor: 'transparent',
    borderColor: COLORS.text,
    borderRadius: 2,
    borderWidth: 1,
    marginRight: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.gold,
  },
  filterChipText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  filterChipTextActive: {
    color: COLORS.gold,
  },

  /* Sort Options */
  sortContainer: {
    backgroundColor: COLORS.cream,
    borderBottomColor: COLORS.gray200,
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.md + 4,
    paddingVertical: SPACING.sm + 4,
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
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 6,
  },
  sortOptionActive: {
    borderBottomColor: COLORS.gold,
  },
  sortOptionText: {
    color: COLORS.textLight,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
  },
  sortOptionTextActive: {
    color: COLORS.text,
    fontWeight: '700',
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

  /* Grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  gridItem: {
    marginBottom: SPACING.md + 4,
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
    paddingHorizontal: SPACING.md + 4,
    paddingVertical: SPACING.sm + 4,
  },
  groupTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  groupCount: {
    color: COLORS.textLight,
    fontSize: 12,
    letterSpacing: 1,
  },
  horizontalList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },

  /* Painting Card */
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
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: SPACING.sm,
  },
  paintingArtist: {
    color: COLORS.textLight,
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  paintingYear: {
    color: COLORS.gray500,
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 2,
  },

  /* Badges */
  seenBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(230, 57, 70, 0.95)',
    borderRadius: 12,
    elevation: 4,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: SPACING.sm,
    shadowColor: COLORS.black,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    top: SPACING.sm,
    width: 24,
  },
  wantToVisitBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    borderRadius: 12,
    elevation: 4,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: SPACING.sm,
    shadowColor: COLORS.black,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    top: SPACING.sm,
    width: 24,
  },
  badgeIcon: {
    color: COLORS.textInverse,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 12,
    textAlign: 'center',
  },
});