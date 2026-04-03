import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Collection } from '@/screens/Collection/Collection';
import { Palette } from '@/screens/Palette/Palette';
import { Search } from '@/screens/Search/Search';
import { Settings } from '@/screens/Settings/Settings';
import { Visits } from '@/screens/Visits/Visits';
import { Paths } from '@/navigation/paths';
import { COLORS } from '@/constants/colors';
import { TAB_BAR } from '@/constants/dimensions';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.black,
          borderTopWidth: 1,
          borderTopColor: `${COLORS.gold}66`,
          paddingBottom: Math.max(insets.bottom, TAB_BAR.minPaddingBottom),
          height: TAB_BAR.height + insets.bottom,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: `${COLORS.textInverse}80`,
        tabBarLabelStyle: {
          fontSize: TAB_BAR.labelFontSize,
          letterSpacing: TAB_BAR.labelLetterSpacing,
          fontWeight: '600',
          marginTop: TAB_BAR.labelMarginTop,
        },
      }}
    >
      <Tab.Screen
        name={Paths.Visits}
        component={Visits}
        options={{
          tabBarLabel: 'VISITS',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: TAB_BAR.iconFontSize }}>⛩</Text>
          ),
        }}
      />
      <Tab.Screen
        name={Paths.Home}
        component={Collection}
        options={{
          tabBarLabel: 'COLLECTION',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: TAB_BAR.iconFontSize }}>▦</Text>
          ),
        }}
      />
      <Tab.Screen
        name={Paths.Search}
        component={Search}
        options={{
          tabBarLabel: 'SEARCH',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: TAB_BAR.iconFontSize }}>⌕</Text>
          ),
        }}
      />
      <Tab.Screen
        name={Paths.Palette}
        component={Palette}
        options={{
          tabBarLabel: 'PALETTE',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: TAB_BAR.iconFontSize }}>◆</Text>
          ),
        }}
      />
      <Tab.Screen
        name={Paths.Settings}
        component={Settings}
        options={{
          tabBarLabel: 'SETTINGS',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: TAB_BAR.iconFontSize }}>⚙︎</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
