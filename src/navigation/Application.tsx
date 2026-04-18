import type { RootStackParamList } from '@/navigation/types';

import { NavigationContainer } from '@react-navigation/native';
import {
  createStackNavigator,
  CardStyleInterpolators,
} from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TabNavigator } from '@/navigation/TabNavigator';

import { Paths } from '@/navigation/paths';
import { useTheme } from '@/theme';
import { useAuth } from '@/contexts/AuthContext';

import {
  Startup,
  PaintingDetail,
  ArtistProfile,
  VisitDetail,
  MuseumCollection,
  LikedPaintings,
  VisitPalette,
  ViewPalette,
  Auth,
  Search,
} from '@/screens';

const Stack = createStackNavigator<RootStackParamList>();

function ApplicationNavigator() {
  const { navigationTheme, variant } = useTheme();
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          key={variant}
          screenOptions={{
            headerShown: false,
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          }}
        >
          {user ? (
            // Authenticated screens
            <>
              <Stack.Screen component={Startup} name={Paths.Startup} />
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
              <Stack.Screen
                component={VisitDetail}
                name={Paths.VisitDetail}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                component={MuseumCollection}
                name={Paths.MuseumCollection}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                component={Search}
                name={Paths.Search}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                component={LikedPaintings}
                name={Paths.LikedPaintings}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                component={VisitPalette}
                name={Paths.VisitPalette}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                component={ViewPalette}
                name={Paths.ViewPalette}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            // Unauthenticated screens
            <>
              <Stack.Screen
                component={Auth}
                name={Paths.Auth}
                options={{ headerShown: false }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default ApplicationNavigator;
