/**
 * Finexa AI — Mobile App Entry Point
 */
import './src/lib/apiBridge'; // MUST be first — initializes secure token storage

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import GamificationScreen from './src/screens/GamificationScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const icons: Record<string, string> = {
  Home: '🏠', Chat: '✨', Transactions: '💳', Rewards: '🏆', Profile: '👤',
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerStyle: { backgroundColor: '#003d3d' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '600' },
            tabBarStyle: {
              backgroundColor: '#003d3d',
              borderTopColor: 'rgba(42,43,47,0.15)',
              paddingBottom: 6,
              paddingTop: 6,
              height: 62,
            },
            tabBarActiveTintColor: '#cdface',
            tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
            tabBarLabel: ({ color, focused }) => (
              <Text style={{ color, fontSize: 10, fontWeight: focused ? '600' : '400', marginTop: -2 }}>
                {route.name}
              </Text>
            ),
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20 }}>{icons[route.name]}</Text>
            ),
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
          <Tab.Screen name="Chat" component={ChatScreen} options={{ title: 'AI Assistant', headerShown: false }} />
          <Tab.Screen name="Transactions" component={TransactionsScreen} options={{ headerShown: false }} />
          <Tab.Screen name="Rewards" component={GamificationScreen} options={{ headerShown: false }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
