import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

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
    paddingTop: 50,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  backIcon: {
    color: COLORS.gold,
    fontSize: 28,
    fontWeight: '300',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  headerTitle: {
    color: COLORS.gold,
    fontSize: 20,
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
    fontSize: 10,
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
    fontSize: 28,
    fontWeight: '300',
    marginBottom: 4,
  },
  seenNumber: {
    color: '#e63946',
  },
  wantNumber: {
    color: '#f59e0b',
  },
  statLabel: {
    color: 'rgba(212, 175, 55, 0.7)',
    fontSize: 9,
    letterSpacing: 2,
  },
  statDivider: {
    paddingHorizontal: SPACING.sm,
  },
  statDividerText: {
    color: 'rgba(212, 175, 55, 0.3)',
    fontSize: 16,
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
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: SPACING.sm + 4,
  },
  museumRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: SPACING.sm,
  },
  museumName: {
    color: 'rgba(212, 175, 55, 0.8)',
    flex: 1,
    fontSize: 12,
  },
  museumCountBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: COLORS.gold,
    borderRadius: 2,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    minWidth: 28,
    paddingHorizontal: SPACING.sm,
  },
  museumCount: {
    color: COLORS.gold,
    fontSize: 12,
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
    fontSize: 11,
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
    margin: 4,
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
    fontSize: 32,
    opacity: 0.5,
  },
  paintingTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    marginBottom: 2,
  },
  paintingYear: {
    color: COLORS.gray500,
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  paintingMuseum: {
    color: COLORS.textLight,
    fontSize: 9,
    fontStyle: 'italic',
  },

  /* Badges */
  seenBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(230, 57, 70, 0.95)',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 20,
  },
  wantBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 20,
  },
  badgeText: {
    color: COLORS.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },
});