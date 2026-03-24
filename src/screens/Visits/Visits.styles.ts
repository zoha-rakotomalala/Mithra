import { StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const visitsStyles = StyleSheet.create({
  // Header - Art Deco Black & Gold (matches Search)
  header: {
    backgroundColor: COLORS.black,
    paddingTop: Platform.OS === 'android' ? 65 : 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
    alignItems: 'center',
  },

  headerDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '60%',
    marginTop: SPACING.sm,
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
    fontSize: 13,
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
    fontSize: 64,
    marginBottom: SPACING.lg,
    opacity: 0.5,
  },

  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // FAB - Cleaner style
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
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
    fontSize: 32,
    color: COLORS.black,
    fontWeight: '300',
    lineHeight: 32,
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
    fontSize: 28,
    color: COLORS.gold,
    fontWeight: '300',
    lineHeight: 28,
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
    fontSize: 15,
    color: COLORS.black,
  },

  inputText: {
    color: COLORS.black,
    fontSize: 15,
  },

  inputPlaceholder: {
    color: COLORS.black + '60',
    fontSize: 15,
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
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    backgroundColor: COLORS.cream,
  },

  colorBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.md,
  },

  museumOptionText: {
    flex: 1,
  },

  // Validation
  inputError: {
    borderColor: '#A4161A',
  },

  validationText: {
    color: '#A4161A',
    fontSize: 12,
    marginTop: -SPACING.xs,
  },
});