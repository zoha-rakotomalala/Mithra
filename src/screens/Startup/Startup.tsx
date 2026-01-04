import type { RootScreenProps } from '@/navigation/types';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Paths } from '@/navigation/paths';
import { shared, typography } from '@/styles';
import { COLORS } from '@/constants';

function Startup({ navigation }: RootScreenProps<Paths.Startup>) {
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
      <Text style={[typography.h1, { color: COLORS.gold, marginBottom: 32 }]}>
        PALETTE
      </Text>
      <View style={shared.artDecoDivider} />

      {isFetching && (
        <ActivityIndicator
          size="large"
          color={COLORS.gold}
          style={{ marginTop: 32 }}
        />
      )}

      {isError && (
        <Text style={[typography.body, { color: '#e63946', marginTop: 32 }]}>
          Loading error occurred
        </Text>
      )}
    </View>
  );
}

export default Startup;
