import { StyleSheet } from 'react-native';
import { COLORS } from '@/constants';

export const startupStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.black,
  },
  logo: {
    width: 240,
    height: 240,
    marginBottom: 32,
  },
  loader: {
    marginTop: 32,
  },
  errorText: {
    color: '#e63946',
    marginTop: 32,
    fontSize: 16,
  },
});
