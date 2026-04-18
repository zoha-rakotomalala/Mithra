import { StyleSheet, Platform } from 'react-native';
import {
  COLORS,
  SPACING,
  ANDROID_STATUS_BAR_PADDING,
  FONT_SIZE,
  ICON_SIZE,
  TOUCHABLE_HEIGHT,
} from '@/constants';

export const visitsStyles = StyleSheet.create({
  // Safe Area - Matches Collection/Search
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.black,
    paddingTop: ANDROID_STATUS_BAR_PADDING,
  },

  // Header - Art Deco Black & Gold (matches Collection)
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

  // Stats Row - Matches Collection's statsRow pattern
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
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(212, 175, 55, 0.5)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // List Content
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100, // Space for FAB
    backgroundColor: COLORS.cream,
  },

  // Visit Cards - Cleaner, more minimal
  visitCard: {
    backgroundColor: COLORS.ivory,
    borderRadius: 2, // Sharper corners like Search
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)', // Matches Search border
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  visitHeader: {
    marginBottom: SPACING.sm,
  },

  visitNotes: {
    marginTop: SPACING.xs,
    color: COLORS.black + 'AA',
    fontStyle: 'italic',
    fontSize: FONT_SIZE.body,
    lineHeight: 18,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.lg,
  },

  emptyIcon: {
    fontSize: FONT_SIZE.display,
    marginBottom: SPACING.lg,
    opacity: 0.5,
  },

  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.body,
    letterSpacing: 0.5,
  },

  // FAB - Cleaner style
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: TOUCHABLE_HEIGHT.xl,
    height: TOUCHABLE_HEIGHT.xl,
    borderRadius: 2, // Sharp corners
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: COLORS.black,
  },

  fabText: {
    fontSize: FONT_SIZE['6xl'],
    color: COLORS.black,
    fontWeight: '300',
    lineHeight: FONT_SIZE['6xl'],
  },

  // Modal Header - Matches Search modal
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 65 : 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.black,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  },

  closeButton: {
    fontSize: FONT_SIZE['5xl'],
    color: COLORS.gold,
    fontWeight: '300',
    lineHeight: FONT_SIZE['5xl'],
  },

  // Modal Content
  modalContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    backgroundColor: COLORS.cream,
    flex: 1,
  },

  // Inputs - Cleaner style matching Search aesthetic
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 2, // Sharp corners
    padding: SPACING.md,
    fontSize: FONT_SIZE.xl,
    color: COLORS.black,
  },

  inputText: {
    color: COLORS.black,
    fontSize: FONT_SIZE.xl,
  },

  inputPlaceholder: {
    color: COLORS.black + '60',
    fontSize: FONT_SIZE.xl,
  },

  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

  buttonDisabled: {
    opacity: 0.4,
  },

  // Museum Picker Options
  museumOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 2,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  colorBadge: {
    width: ICON_SIZE.xs,
    height: ICON_SIZE.xs,
    borderRadius: ICON_SIZE.xs / 2,
    marginRight: SPACING.md,
  },

  museumOptionText: {
    flex: 1,
  },

  // Museum Picker Field - distinct from free-text inputs
  museumPickerField: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 2,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  chevronIcon: {
    fontSize: FONT_SIZE.md,
    color: COLORS.gold,
    marginLeft: SPACING.sm,
  },

  // Date Picker Field - matches museum picker treatment
  datePickerField: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 2,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Validation
  inputError: {
    borderColor: '#A4161A',
  },

  validationText: {
    color: '#A4161A',
    fontSize: FONT_SIZE.md,
    marginTop: -SPACING.xs,
  },
});
