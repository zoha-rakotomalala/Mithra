import { StyleSheet } from 'react-native';

import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZE,
  SPACING,
  ANDROID_STATUS_BAR_PADDING,
} from '@/constants';

export const scanStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.black,
    paddingTop: ANDROID_STATUS_BAR_PADDING,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  // Header (Art Deco black & gold, matches Search)
  header: {
    backgroundColor: COLORS.black,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    marginRight: SPACING.sm,
    paddingVertical: SPACING.xs,
  },

  backText: {
    fontSize: FONT_SIZE['4xl'],
    color: COLORS.gold,
  },

  headerTitle: {
    fontSize: FONT_SIZE['5xl'],
    fontWeight: '300',
    letterSpacing: 4,
    color: COLORS.gold,
    textTransform: 'uppercase',
  },

  // Idle / intro state
  intro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },

  introIcon: {
    fontSize: 72,
    marginBottom: SPACING.md,
  },

  introTitle: {
    fontSize: FONT_SIZE['3xl'],
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },

  introSubtitle: {
    fontSize: FONT_SIZE.body,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: FONT_SIZE['2xl'],
    marginBottom: SPACING.xl,
  },

  // Layout-only wrapper around the shared `buttons.primary` / `buttons.secondary`
  introButton: {
    alignSelf: 'stretch',
    marginBottom: SPACING.md,
  },

  // Busy (analyzing / searching) state
  busy: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },

  previewImage: {
    width: 180,
    height: 180,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },

  busyText: {
    fontSize: FONT_SIZE.body,
    color: COLORS.text,
    marginTop: SPACING.md,
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  busySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },

  // Results
  resultsHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },

  resultsTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.5,
  },

  resultsHint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },

  // Layout-only wrapper around the shared `buttons.secondary` in the results footer
  scanAgainFooter: {
    margin: SPACING.md,
  },
});
