import { StyleSheet } from 'react-native';
import { COLORS, BADGE } from '@/constants';

/**
 * Badge Styles
 * Status badges (Seen, Want to Visit) and Museum badges
 */

export const badges = StyleSheet.create({
  // Status badges (S, W)
  statusBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: BADGE.size,
    height: BADGE.size,
    borderRadius: BADGE.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cream,
  },
  statusBadgeSeen: {
    backgroundColor: COLORS.seen,
  },
  statusBadgeWant: {
    backgroundColor: COLORS.wantToVisit,
  },
  statusBadgeText: {
    fontSize: BADGE.iconSize,
    fontWeight: '700',
    color: COLORS.textInverse,
  },

  // Museum badges
  museumBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    height: BADGE.museumHeight,
    paddingHorizontal: BADGE.museumPadding,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  museumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textInverse,
    letterSpacing: 0.5,
  },

  // Combined badges container (when both status badges present)
  statusBadgeContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    gap: 4,
  },
});
