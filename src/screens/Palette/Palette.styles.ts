import { StyleSheet } from 'react-native';
import { COLORS, SPACING, CARD, ANDROID_STATUS_BAR_PADDING } from '@/constants';

const PALETTE_CARD_SIZE = (CARD.gridWidth * 3 + SPACING.md * 2) / 3;

export const paletteStyles = StyleSheet.create({
  /* Safe Area - Matches Search */
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.black,
    paddingTop: ANDROID_STATUS_BAR_PADDING,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
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
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xl,
  },
  emptySlot: {
    width: PALETTE_CARD_SIZE,
    height: PALETTE_CARD_SIZE * 1.3,
    padding: 4,
  },
  emptyFrame: {
    aspectRatio: 0.75,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    color: COLORS.gray400,
  },
  emptyText: {
    fontSize: 10,
    color: COLORS.gray400,
    marginTop: SPACING.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  /* Extracted inline styles */
  scrollContent: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSpacer: {
    flex: 1,
  },
  headerActionButton: {
    padding: SPACING.xs,
  },
  shareIcon: {
    fontSize: 22,
    color: COLORS.gold,
  },
  syncingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  syncingText: {
    color: COLORS.ivory,
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  gridWrapper: {
    flex: 1,
    justifyContent: 'center',
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