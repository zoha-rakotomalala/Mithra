import { StyleSheet } from 'react-native';
import { COLORS, SPACING, CARD } from '@/constants';

/**
 * Palette Screen Styles
 * Art Deco styling for the palette grid layout
 */

export const paletteStyles = StyleSheet.create({
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

  /* Stats */
  statsBar: {
    backgroundColor: COLORS.black,
    borderBottomColor: COLORS.gold,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  statLabel: {
    color: COLORS.gold,
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 4,
    opacity: 0.7,
  },
  statDivider: {
    justifyContent: 'center',
  },
  statDividerText: {
    color: COLORS.gold,
    fontSize: 24,
    opacity: 0.3,
  },

  /* Info */
  infoSection: {
    borderBottomColor: COLORS.gray200,
    borderBottomWidth: 1,
    padding: SPACING.md + 4,
  },
  infoText: {
    color: COLORS.text,
    fontSize: 14,
    letterSpacing: 1,
    textAlign: 'center',
  },

  /* Grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md + 4,
  },
  emptySlot: {
    margin: 4,
    width: CARD.gridWidth,
  },
  emptyFrame: {
    alignItems: 'center',
    aspectRatio: 0.75,
    borderColor: COLORS.gold,
    borderWidth: 2,
    justifyContent: 'center',
    opacity: 0.3,
  },
  emptyIcon: {
    color: COLORS.gray500,
    fontSize: 32,
  },
  emptyText: {
    color: COLORS.gray500,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 4,
  },

  /* Instructions */
  instructions: {
    padding: SPACING.lg,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: SPACING.md,
  },
  instructionText: {
    color: COLORS.textLight,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
});