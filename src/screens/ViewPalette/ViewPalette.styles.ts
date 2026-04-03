import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS, SPACING } from '@/constants';

const { width } = Dimensions.get('window');
// Grid is inside: content(padding:lg) > shareableGrid(padding:lg) > grid(gap:sm between items)
const gridContainerWidth = width - (SPACING.lg * 4); // 2x content padding + 2x shareableGrid padding
const gridItemSize = (gridContainerWidth - (SPACING.sm * 2)) / 3; // 3 columns, 2 gaps

export const viewPaletteStyles = StyleSheet.create({
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

  headerAction: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
  },

  headerActionIcon: {
    fontSize: 22,
    color: COLORS.gold,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },

  content: {
    padding: SPACING.lg,
  },

  shareableGrid: {
    backgroundColor: COLORS.black,
    padding: SPACING.lg,
    borderRadius: 8,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },

  gridItem: {
    width: gridItemSize,
    height: gridItemSize,
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

  emptyItem: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
  },

  emptyIcon: {
    fontSize: 24,
    color: COLORS.gold,
    opacity: 0.4,
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
});
