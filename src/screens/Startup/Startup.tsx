import type { RootScreenProps } from '@/navigation/types';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { Paths } from '@/navigation/paths';
import { shared } from '@/styles';
import { COLORS } from '@/constants';

const logo = require('@/theme/assets/images/logo.png');

export function Startup({ navigation }: RootScreenProps<Paths.Startup>) {
  const { isError, isFetching, isSuccess } = useQuery({
    queryFn: () => Promise.resolve(true),
    queryKey: ['startup'],
  });

  useEffect(() => {
    if (isSuccess) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  }, [isSuccess, navigation]);

  return (
    <View style={[shared.container, shared.centered, { backgroundColor: COLORS.black }]}>
      <Image
        source={logo}
        style={{ width: 240, height: 240, marginBottom: 32 }}
        resizeMode="contain"
      />

      {isFetching && (
        <ActivityIndicator
          size="large"
          color={COLORS.gold}
          style={{ marginTop: 32 }}
        />
      )}

      {isError && (
        <Text style={{ color: '#e63946', marginTop: 32, fontSize: 16 }}>
          Loading error occurred
        </Text>
      )}
    </View>
  );
}
