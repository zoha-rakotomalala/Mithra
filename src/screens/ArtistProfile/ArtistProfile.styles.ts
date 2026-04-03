import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, ICON_SIZE, TOUCHABLE_HEIGHT } from '@/constants';

/**
 * Artist Profile Screen Styles
 * Art Deco styling for artist detail view
 */

export const artistProfileStyles = StyleSheet.create({
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md + 4,
    paddingTop: SPACING.xxl + 2,
  },
  backButton: {
    alignItems: 'center',
    height: TOUCHABLE_HEIGHT.lg,
    justifyContent: 'center',
    width: TOUCHABLE_HEIGHT.lg,
  },
  backIcon: {
    color: COLORS.gold,
    fontSize: FONT_SIZE['5xl'],
    fontWeight: '300',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  headerTitle: {
    color: COLORS.gold,
    fontSize: FONT_SIZE['3xl'],
    fontWeight: '300',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  headerDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '80%',
  },
  dividerLine: {
    backgroundColor: COLORS.gold,
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
  dividerOrnament: {
    color: COLORS.gold,
    fontSize: FONT_SIZE.xs,
    marginHorizontal: SPACING.sm,
  },

  /* Stats Section */
  statsSection: {
    backgroundColor: COLORS.black,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 4,
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: COLORS.gold,
    fontSize: FONT_SIZE['5xl'],
    fontWeight: '300',
    marginBottom: SPACING.xs,
  },
  seenNumber: {
    color: COLORS.danger,
  },
  wantNumber: {
    color: COLORS.amber,
  },
  statLabel: {
    color: 'rgba(212, 175, 55, 0.7)',
    fontSize: FONT_SIZE.xxs,
    letterSpacing: 2,
  },
  statDivider: {
    paddingHorizontal: SPACING.sm,
  },
  statDividerText: {
    color: 'rgba(212, 175, 55, 0.3)',
    fontSize: FONT_SIZE['2xl'],
  },

  /* Museums Section */
  museumsSection: {
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
    borderTopWidth: 1,
    paddingTop: SPACING.md,
  },
  sectionDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: SPACING.sm + 4,
  },
  sectionDividerLine: {
    backgroundColor: COLORS.gold,
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  museumsSectionTitle: {
    color: 'rgba(212, 175, 55, 0.9)',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: SPACING.sm + 4,
  },
  museumRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.sm,
  },
  museumName: {
    color: 'rgba(212, 175, 55, 0.8)',
    flex: 1,
    fontSize: FONT_SIZE.md,
  },
  museumCountBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: COLORS.gold,
    borderRadius: 2,
    borderWidth: 1,
    height: TOUCHABLE_HEIGHT.sm,
    justifyContent: 'center',
    minWidth: TOUCHABLE_HEIGHT.sm,
    paddingHorizontal: SPACING.sm,
  },
  museumCount: {
    color: COLORS.gold,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },

  /* Actions Section */
  actionsSection: {
    backgroundColor: COLORS.cream,
    borderBottomColor: COLORS.gray200,
    borderBottomWidth: 1,
    padding: SPACING.md,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: COLORS.text,
    borderColor: COLORS.gold,
    borderRadius: 2,
    borderWidth: 2,
    paddingHorizontal: SPACING.md + 4,
    paddingVertical: 14,
  },
  actionButtonText: {
    color: COLORS.gold,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 2,
  },

  /* Grid */
  gridContent: {
    padding: SPACING.sm + 4,
    paddingBottom: 80, // Extra padding for Android nav bar
  },
  paintingCard: {
    flex: 1,
    margin: SPACING.xs,
    maxWidth: '31%',
  },
  imageContainer: {
    aspectRatio: 0.75,
    backgroundColor: COLORS.surface,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 2,
    borderWidth: 2,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  paintingImage: {
    height: '100%',
    width: '100%',
  },
  placeholderImage: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  placeholderIcon: {
    fontSize: FONT_SIZE['6xl'],
    opacity: 0.5,
  },
  paintingTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    lineHeight: FONT_SIZE.lg,
    marginBottom: 2,
  },
  paintingYear: {
    color: COLORS.gray500,
    fontSize: FONT_SIZE.xxs,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  paintingMuseum: {
    color: COLORS.textLight,
    fontSize: FONT_SIZE.xxs,
    fontStyle: 'italic',
  },

  /* Badges */
  seenBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(230, 57, 70, 0.95)',
    borderRadius: BORDER_RADIUS.xl,
    height: ICON_SIZE.md,
    justifyContent: 'center',
    position: 'absolute',
    right: SPACING.sm - 2,
    top: SPACING.sm - 2,
    width: ICON_SIZE.md,
  },
  wantBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    borderRadius: BORDER_RADIUS.xl,
    height: ICON_SIZE.md,
    justifyContent: 'center',
    position: 'absolute',
    right: SPACING.sm - 2,
    top: SPACING.sm - 2,
    width: ICON_SIZE.md,
  },
  badgeText: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});