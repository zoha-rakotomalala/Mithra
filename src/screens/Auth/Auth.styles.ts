import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

/**
 * Auth Screen Styles
 * Art Deco styling for authentication forms
 */

export const authStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cream,
    padding: SPACING.xl,
  },

  title: {
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: SPACING.md,
    letterSpacing: 2,
    fontWeight: 'bold',
  },

  subtitle: {
    color: COLORS.black + 'CC',
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    fontStyle: 'italic',
  },

  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.ivory,
    padding: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.gold,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  input: {
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 0, // Art Deco geometric
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
  },

  switchButton: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gold + '40',
  },

  switchText: {
    color: COLORS.black + 'AA',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
