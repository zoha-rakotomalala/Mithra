import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const likedPaintingsStyles = StyleSheet.create({
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
    fontSize: 24,
    color: COLORS.text,
  },

  resultsHeader: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#f9f9f9',
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
});
