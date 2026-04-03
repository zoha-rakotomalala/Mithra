import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS, SPACING } from '@/constants';

const { width } = Dimensions.get('window');
const tileSize = (width - 64) / 3;

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
    flex: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },

  shareableGrid: {
    backgroundColor: COLORS.black,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xl,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  centerItem: {
    width: tileSize,
    height: tileSize * 1.3,
    borderWidth: 1,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
    margin: 4,
  },

  centerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },

  centerDate: {
    fontSize: 10,
    color: COLORS.black,
    textAlign: 'center',
  },
});
