import type { RootScreenProps } from '@/navigation/types';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { Paths } from '@/navigation/paths';
import { shared } from '@/styles';
import { COLORS } from '@/constants';
import { startupStyles as styles } from './Startup.styles';

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
    <View style={[shared.container, shared.centered, styles.container]}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />

      {isFetching && (
        <ActivityIndicator
          size="large"
          color={COLORS.gold}
          style={styles.loader}
        />
      )}

      {isError && <Text style={styles.errorText}>Loading error occurred</Text>}
    </View>
  );
}
