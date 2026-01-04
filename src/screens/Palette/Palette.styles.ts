import { StyleSheet } from 'react-native';
import { COLORS, SPACING, CARD } from '@/constants';

const PALETTE_CARD_SIZE = (CARD.gridWidth * 3 + SPACING.md * 2) / 3;

export const paletteStyles = StyleSheet.create({
  /* Header */
  header: {
    paddingTop: 60,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  },
  headerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
  },
  dividerOrnament: {
    fontSize: 12,
    color: COLORS.gold,
    marginHorizontal: SPACING.md,
  },

  /* Stats */
  statsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.black,
    paddingVertical: SPACING.md,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.gold}4D`,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '300',
    color: COLORS.gold,
  },
  statLabel: {
    color: `${COLORS.gold}B3`,
    marginTop: SPACING.xs,
  },
  statDivider: {
    justifyContent: 'center',
  },
  statDividerText: {
    fontSize: 24,
    color: `${COLORS.gold}4D`,
  },

  /* Info */
  infoSection: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoText: {
    textAlign: 'center',
    color: COLORS.text,
    letterSpacing: 1,
  },

  /* Grid - 3x3 layout */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  emptySlot: {
    width: PALETTE_CARD_SIZE,
    margin: SPACING.xs,
  },
  emptyFrame: {
    aspectRatio: 0.75,
    borderWidth: 2,
    borderColor: `${COLORS.gold}4D`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    color: COLORS.gray400,
  },
  emptyText: {
    color: COLORS.gray400,
    marginTop: SPACING.xs,
  },

  /* Instructions */
  instructions: {
    padding: SPACING.lg,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.text,
    marginHorizontal: SPACING.md,
  },
  instructionText: {
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 22,
  },
});
