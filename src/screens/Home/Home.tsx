import { useNavigation } from '@react-navigation/native';
import { Text, View } from 'react-native';
import { shared, typography } from '@/styles';
import { COLORS } from '@/constants';

export function Home() {
  const navigation = useNavigation();

  return (
    <View style={[shared.container, shared.centered, { backgroundColor: COLORS.cream }]}>
      <Text style={[typography.h1, { color: COLORS.black }]}>HOME</Text>
      <View style={shared.artDecoDivider} />
      <Text style={[typography.body, { color: COLORS.black, textAlign: 'center' }]}>
        Welcome to your art collection
      </Text>
    </View>
  );
}
