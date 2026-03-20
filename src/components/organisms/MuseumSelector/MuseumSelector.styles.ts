import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  checkbox: {
    alignItems: 'center',
    borderColor: '#999',
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  container: {
    backgroundColor: '#f5f3ed',
    flex: 1,
  },
  museumCard: {
    backgroundColor: '#fff',
    borderColor: '#e0ddd5',
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
    color: '#999',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  museumDescription: {
    color: '#666',
    fontSize: 11,
    lineHeight: 16,
  },
  museumInfo: {
    flex: 1,
  },
  museumName: {
    color: '#2c2c2c',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  museumNameSelected: {
    color: '#004d40',
  },
  quickActions: {
    borderBottomColor: '#e0ddd5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  quickButton: {
    alignItems: 'center',
    backgroundColor: '#004d40',
    borderColor: '#d4af37',
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickButtonClear: {
    backgroundColor: 'transparent',
    borderColor: '#999',
  },
  quickButtonClearText: {
    color: '#666',
  },
  quickButtonText: {
    color: '#d4af37',
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
    color: '#666',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#004d40',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: 12,
  },
  selectedInfo: {
    backgroundColor: '#fff',
    borderBottomColor: '#e0ddd5',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedText: {
    color: '#004d40',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
