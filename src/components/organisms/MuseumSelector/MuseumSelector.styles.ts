import { StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';

export const styles = StyleSheet.create({
  checkbox: {
    alignItems: 'center',
    borderColor: COLORS.textDisabled,
    borderRadius: 4,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    marginRight: 12,
    width: 24,
  },
  checkboxSelected: {
    borderColor: 'transparent',
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  container: {
    backgroundColor: COLORS.backgroundCream,
    flex: 1,
  },
  museumCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.borderCream,
    borderRadius: 4,
    borderWidth: 2,
    marginBottom: 10,
    padding: 14,
  },
  museumCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  museumCardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderWidth: 2,
  },
  museumCountry: {
    color: COLORS.textDisabled,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  museumDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  museumInfo: {
    flex: 1,
  },
  museumName: {
    color: COLORS.nearBlack,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  museumNameSelected: {
    color: COLORS.teal,
  },
  quickActions: {
    borderBottomColor: COLORS.borderCream,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  quickButton: {
    alignItems: 'center',
    backgroundColor: COLORS.teal,
    borderColor: COLORS.gold,
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickButtonClear: {
    backgroundColor: 'transparent',
    borderColor: COLORS.textDisabled,
  },
  quickButtonClearText: {
    color: COLORS.textMuted,
  },
  quickButtonText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    color: COLORS.teal,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: 12,
  },
  selectedInfo: {
    backgroundColor: COLORS.white,
    borderBottomColor: COLORS.borderCream,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedText: {
    color: COLORS.teal,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
