import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const likedPaintingsStyles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.black,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  },

  backButton: {
    marginBottom: SPACING.md,
  },

  backText: {
    fontSize: 24,
    color: COLORS.gold,
  },

  resultsHeader: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cream,
  },

  contentArea: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  paintingCard: {
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 2,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
});
