import { StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const visitDetailStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.black,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },

  header: {
    backgroundColor: COLORS.black,
    borderBottomColor: COLORS.gold,
    borderBottomWidth: 2,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    marginRight: SPACING.sm,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 4,
    color: COLORS.gold,
    textTransform: 'uppercase',
    flexShrink: 1,
  },

  content: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.lg,
    backgroundColor: COLORS.cream,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
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

  readOnlyField: {
    color: COLORS.textLight,
    backgroundColor: COLORS.background,
  },

  backText: {
    fontSize: 24,
    color: COLORS.gold,
  },
});
