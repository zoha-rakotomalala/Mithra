import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Collection } from '@/screens/Collection/Collection';
import { Profile } from '@/screens/Profile/Profile';
import { Search } from '@/screens/Search/Search';
import { Settings } from '@/screens/Settings/Settings';
import { Paths } from '@/navigation/paths';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopWidth: 1,
          borderTopColor: 'rgba(212,175,55,0.4)',
          paddingBottom: Math.max(insets.bottom, 12),
          height: 64 + insets.bottom,
        },
        tabBarActiveTintColor: '#d4af37',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarLabelStyle: {
          fontSize: 10,
          letterSpacing: 2,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name={Paths.Home}
        component={Collection}
        options={{
          tabBarLabel: 'COLLECTION',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 16 }}>▦</Text>
          ),
        }}
      />
      <Tab.Screen
        name={Paths.Search}
        component={Search}
        options={{
          tabBarLabel: 'SEARCH',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 16 }}>⌕</Text>
          ),
        }}
      />
      <Tab.Screen
        name={Paths.Profile}
        component={Profile}
        options={{
          tabBarLabel: 'PALETTE',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 16 }}>◆</Text>
          ),
        }}
      />
      <Tab.Screen
        name={Paths.Settings}
        component={Settings}
        options={{
          tabBarLabel: 'SETTINGS',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 16 }}>⚙︎</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
