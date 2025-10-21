import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Profile, Search, Settings } from '@/screens';
import { Paths } from '@/navigation/paths';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // Hide headers in tabs since Stack already has them
      }}
    >
      <Tab.Screen
        name={Paths.Home}
        component={Home}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name={Paths.Search}
        component={SearchPlaceholder}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🔍</Text>
          ),
        }}
      />
      <Tab.Screen
        name={Paths.Profile}
        component={Profile}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Temporary placeholder for Search screen until you create it
import { View, Text as RNText, StyleSheet } from 'react-native';

function SearchPlaceholder() {
  return (
    <View style={styles.container}>
      <RNText style={styles.text}>Search Screen Coming Soon</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
});