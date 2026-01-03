import type { RootStackParamList } from '@/navigation/types';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Paths } from '@/navigation/paths';
import { TabNavigator } from '@/navigation/TabNavigator';
import { useTheme } from '@/theme';

import { ArtistProfile, Example, Home, PaintingDetail, Profile, Settings, Startup } from '@/screens';

const Stack = createStackNavigator<RootStackParamList>();

function ApplicationNavigator() {
  const { navigationTheme, variant } = useTheme();

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator key={variant} screenOptions={{ headerShown: false }}>
          <Stack.Screen component={Startup} name={Paths.Startup} />
          <Stack.Screen component={Example} name={Paths.Example} />
          <Stack.Screen component={Home} name={Paths.Home} />
          <Stack.Screen component={Profile} name={Paths.Profile} />
          <Stack.Screen component={Settings} name={Paths.Settings} />
          <Stack.Screen
              component={TabNavigator}
              name="Main"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              component={PaintingDetail}
              name={Paths.PaintingDetail}
              options={{ headerShown: false }}
              />
            <Stack.Screen
              component={ArtistProfile}
              name={Paths.ArtistProfile}
              options={{ headerShown: false }}
            />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default ApplicationNavigator;
