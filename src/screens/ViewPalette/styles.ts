import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, SPACING } from '@/constants';

const { width } = Dimensions.get('window');
const gridSize = (width - (SPACING.lg * 2) - (SPACING.sm * 2)) / 3;

export const viewPaletteStyles = StyleSheet.create({
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

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },

  content: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },

  gridItem: {
    width: gridSize,
    height: gridSize,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },

  image: {
    width: '100%',
    height: '100%',
  },

  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: SPACING.xs,
  },

  artist: {
    fontSize: 10,
    color: COLORS.ivory,
    fontWeight: '600',
  },

  centerItem: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    padding: SPACING.sm,
  },

  centerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },

  centerDate: {
    fontSize: 11,
    color: COLORS.black,
    textAlign: 'center',
  },

  actions: {
    gap: SPACING.md,
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
    gap: SPACING.md,
  },

  emptyIcon: {
    fontSize: 64,
  },
});
