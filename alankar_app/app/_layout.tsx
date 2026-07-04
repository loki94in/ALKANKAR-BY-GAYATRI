import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDatabase } from '../services/database';
import { useStore } from '../store/useStore';
import { Colors } from '../constants/Colors';

export default function RootLayout() {
  const { loadCart, loadFavorites } = useStore();

  useEffect(() => {
    try {
      // Initialize local database schemas
      initDatabase();
      
      // Load stored offline states
      loadCart();
      loadFavorites();
    } catch (e) {
      console.error('Failed to initialize app storage:', e);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.dark.crimsonDark,
          },
          headerTintColor: Colors.dark.gold,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: Colors.dark.bg,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ title: 'Product Details' }} />
        <Stack.Screen name="login" options={{ title: 'Admin Login', presentation: 'modal' }} />
        <Stack.Screen name="admin/index" options={{ title: 'Admin Dashboard', headerBackVisible: false }} />
        <Stack.Screen name="admin/products" options={{ title: 'Manage Products' }} />
        <Stack.Screen name="admin/categories" options={{ title: 'Manage Categories' }} />
        <Stack.Screen name="admin/orders" options={{ title: 'Manage Orders' }} />
        <Stack.Screen name="admin/settings" options={{ title: 'Store Settings' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
