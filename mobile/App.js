import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/client/HomeScreen';
import CartScreen from './src/screens/client/CartScreen';
import OrdersScreen from './src/screens/client/OrdersScreen';
import ProfileScreen from './src/screens/client/ProfileScreen';
import OrderTrackingScreen from './src/screens/client/OrderTrackingScreen';
import MerchantDetailsScreen from './src/screens/client/MerchantDetailsScreen';
import DeliveryHomeScreen from './src/screens/delivery/DeliveryHomeScreen';
import DeliveryOrdersScreen from './src/screens/delivery/DeliveryOrdersScreen';
import DeliveryTrackingScreen from './src/screens/delivery/DeliveryTrackingScreen';
import DeliveryProfileScreen from './src/screens/delivery/DeliveryProfileScreen';
import DeliveryMapScreen from './src/screens/delivery/DeliveryMapScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Accueil', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ tabBarLabel: 'Commandes', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📦</Text> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profil', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

function DeliveryTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="DeliveryHome"
        component={DeliveryHomeScreen}
        options={{ tabBarLabel: 'Accueil', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="DeliveryOrders"
        component={DeliveryOrdersScreen}
        options={{ tabBarLabel: 'Livraisons', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🚚</Text> }}
      />
      <Tab.Screen
        name="DeliveryProfile"
        component={DeliveryProfileScreen}
        options={{ tabBarLabel: 'Profil', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user.role === 'client' ? (
          <>
            <Stack.Screen name="ClientTabs" component={ClientTabs} />
            <Stack.Screen name="MerchantDetails" component={MerchantDetailsScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
          </>
        ) : user.role === 'livreur' ? (
          <>
            <Stack.Screen name="DeliveryTabs" component={DeliveryTabs} />
            <Stack.Screen name="DeliveryTracking" component={DeliveryTrackingScreen} />
            <Stack.Screen name="DeliveryMap" component={DeliveryMapScreen} />
          </>
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
