import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.gold,
        tabBarInactiveTintColor: Colors.dark.silver,
        tabBarStyle: {
          backgroundColor: Colors.dark.crimsonDark,
          borderTopWidth: 1,
          borderTopColor: Colors.dark.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: Colors.dark.crimsonDark,
          borderBottomWidth: 1,
          borderBottomColor: Colors.dark.border,
        },
        headerTintColor: Colors.dark.gold,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Catalog',
          tabBarLabel: 'Catalog',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
          headerRight: () => (
            <Pressable 
              onPress={() => router.push('/login')}
              style={({ pressed }: { pressed: boolean }) => [
                styles.adminBtn,
                pressed && { opacity: 0.7 }
              ]}
            >
              <Ionicons name="shield-checkmark-outline" size={24} color={Colors.dark.gold} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'My Cart',
          tabBarLabel: 'Cart',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons name={focused ? 'bag-handle' : 'bag-handle-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarLabel: 'Favorites',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  adminBtn: {
    marginRight: 16,
    padding: 4,
  },
});
