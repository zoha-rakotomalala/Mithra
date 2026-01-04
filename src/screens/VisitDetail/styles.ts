import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const visitDetailStyles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.background,
  },

  backButton: {
    marginBottom: SPACING.md,
  },

  backText: {
    fontSize: 32,
    color: COLORS.text,
    fontWeight: '300',
  },

  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },

  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gold,
    padding: SPACING.md,
    gap: SPACING.md,
  },

  infoRow: {
    gap: SPACING.xs,
  },

  actions: {
    gap: SPACING.md,
  },

  deleteButton: {
    borderColor: '#dc2626',
  },

  deleteText: {
    color: '#dc2626',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },

  emptyIcon: {
    fontSize: 64,
  },

  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold,
  },

  closeButton: {
    fontSize: 32,
    color: COLORS.text,
    fontWeight: '300',
  },

  modalContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },

  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
  },

  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

  buttonDisabled: {
    opacity: 0.5,
  },
});
