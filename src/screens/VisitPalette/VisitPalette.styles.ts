import { StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const visitPaletteStyles = StyleSheet.create({
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

  backText: {
    fontSize: 24,
    color: COLORS.gold,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 4,
    color: COLORS.gold,
    textTransform: 'uppercase',
    flexShrink: 1,
  },

  subtitle: {
    fontSize: 16,
    color: COLORS.gold,
    fontWeight: '600',
    marginTop: SPACING.xs,
    letterSpacing: 1,
  },

  // Selection card
  selectCard: {
    marginBottom: SPACING.xs,
  },

  selectImageWrap: {
    aspectRatio: 1 / 1.3,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },

  selectImageSelected: {
    borderColor: COLORS.goldLight,
  },

  selectImage: {
    width: '100%',
    height: '100%',
  },

  checkmark: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkmarkText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '700',
  },

  selectTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
  },

  selectArtist: {
    fontSize: 10,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },

  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  buttonDisabled: {
    opacity: 0.5,
  },
});
