import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Paths } from '@/navigation/paths';

import { Collection } from '@/screens/Collection/Collection';
import { Palette } from '@/screens/Palette/Palette';
import { Search } from '@/screens/Search/Search';
import { Settings } from '@/screens/Settings/Settings';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#d4af37',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 2,
          marginTop: 4,
        },
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: 'rgba(212,175,55,0.4)',
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      }}
    >
      <Tab.Screen
        component={Collection}
        name={Paths.Home}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 16 }}>▦</Text>
          ),
          tabBarLabel: 'COLLECTION',
        }}
      />
      <Tab.Screen
        component={Search}
        name={Paths.Search}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 16 }}>⌕</Text>
          ),
          tabBarLabel: 'SEARCH',
        }}
      />
      <Tab.Screen
        component={Palette}
        name={Paths.Palette}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 16 }}>◆</Text>
          ),
          tabBarLabel: 'PALETTE',
        }}
      />
      <Tab.Screen
        component={Settings}
        name={Paths.Settings}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 16 }}>⚙︎</Text>
          ),
          tabBarLabel: 'SETTINGS',
        }}
      />
    </Tab.Navigator>
  );
}
