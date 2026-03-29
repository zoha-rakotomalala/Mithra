import { StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@/constants';

export const museumBrowserStyles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.black,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
    alignItems: 'center',
  },

  backButton: {
    position: 'absolute',
    left: SPACING.lg,
    top: 70,
    zIndex: 1,
  },

  backText: {
    fontSize: 28,
    color: COLORS.gold,
    fontWeight: '300',
  },

  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    backgroundColor: COLORS.cream,
  },

  museumCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.ivory,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.gold + '40',
    padding: SPACING.lg,
    gap: SPACING.md,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.ivory,
  },

  badgeText: {
    color: COLORS.ivory,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  museumInfo: {
    flex: 1,
    gap: SPACING.xs,
  },

  collectionSize: {
    color: COLORS.gold,
    fontWeight: '600',
  },
});
