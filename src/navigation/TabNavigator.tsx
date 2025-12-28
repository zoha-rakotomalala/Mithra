import React from 'react';
import { Text, Platform } from 'react-native';
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
        tabBarActiveTintColor: '#1a4d3e',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E8E8E8',
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8), // Add safe area padding
          height: 60 + Math.max(insets.bottom, 0), // Increase height for safe area
          backgroundColor: '#fff',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name={Paths.Home}
        component={Collection}
        options={{
          tabBarLabel: 'Collection',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>📚</Text>
          ),
        }}
      />
      <Tab.Screen
        name={Paths.Search}
        component={Search}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>🔍</Text>
          ),
        }}
      />
      <Tab.Screen
        name={Paths.Profile}
        component={Profile}
        options={{
          tabBarLabel: 'Palette',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>🎨</Text>
          ),
        }}
      />
      <Tab.Screen
        name={Paths.Settings}
        component={Settings}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}