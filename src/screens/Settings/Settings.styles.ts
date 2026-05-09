import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const settingsStyles = StyleSheet.create({
  scrollView: {
    backgroundColor: COLORS.black,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  title: {
    color: COLORS.gold,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  sectionGroup: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    color: COLORS.gold + 'CC',
    marginBottom: SPACING.md,
  },
  row: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '40',
  },
  avatarRow: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '40',
    gap: SPACING.sm,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: COLORS.gold,
    fontSize: 28,
    fontWeight: '300',
  },
  curatorNameRow: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '40',
  },
  curatorNameLabel: {
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  },
  curatorNameInput: {
    color: COLORS.cream,
    fontSize: 15,
    backgroundColor: COLORS.gold + '15',
    borderRadius: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
  },
  dangerRow: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.danger + '40',
  },
  bodyTextCream: {
    color: COLORS.cream,
  },
  bodyTextCreamMuted: {
    color: COLORS.cream + 'AA',
  },
  dangerText: {
    color: COLORS.danger,
  },
  goldChevron: {
    color: COLORS.gold,
  },
  footerBox: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.gold + '10',
    borderRadius: 8,
  },
  footerText: {
    color: COLORS.cream + 'AA',
    textAlign: 'center',
    lineHeight: 18,
  },
});
