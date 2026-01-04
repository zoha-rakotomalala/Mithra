import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const visitsStyles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.black,
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

  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    backgroundColor: COLORS.cream,
  },

  visitCard: {
    backgroundColor: COLORS.ivory,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.gold + '40',
    padding: SPACING.lg,
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
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },

  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
    opacity: 0.6,
  },

  emptyText: {
    textAlign: 'center',
    color: COLORS.black + 'AA',
    marginTop: SPACING.sm,
  },

  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
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
    fontSize: 28,
    color: COLORS.black,
    fontWeight: '300',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.black,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  },

  closeButton: {
    fontSize: 24,
    color: COLORS.gold,
    fontWeight: '300',
  },

  modalContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    backgroundColor: COLORS.cream,
    flex: 1,
  },

  input: {
    backgroundColor: COLORS.ivory,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.black,
  },

  inputText: {
    color: COLORS.black,
    fontSize: 16,
  },

  inputPlaceholder: {
    color: COLORS.black + '60',
    fontSize: 16,
  },

  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  museumOption: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '20',
    backgroundColor: COLORS.cream,
  },
});
