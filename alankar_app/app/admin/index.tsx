import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../../constants/Colors';
import { ADMIN_TOKEN_KEY } from '../../services/api';
import { getAllProducts, getAllCategories } from '../../services/database';

export default function AdminDashboard() {
  const router = useRouter();
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    try {
      setLoading(true);
      const prods = getAllProducts();
      const cats = getAllCategories();
      setProductCount(prods.length);
      setCategoryCount(cats.length);
    } catch (e) {
      console.error('Failed to load admin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync(ADMIN_TOKEN_KEY);
      router.replace('/(tabs)/home');
    } catch (e) {
      console.error('Failed to logout:', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.gold} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>CATALOG OVERVIEW</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{productCount}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{categoryCount}</Text>
          <Text style={styles.statLabel}>Categories</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
      
      <Pressable 
        style={styles.actionBtn}
        onPress={() => alert('Add Product Flow (Phase 3)')}
      >
        <Text style={styles.actionBtnText}>Add New Product</Text>
      </Pressable>

      <Pressable 
        style={styles.actionBtn}
        onPress={() => alert('Manage Categories (Phase 3)')}
      >
        <Text style={styles.actionBtnText}>Manage Categories</Text>
      </Pressable>

      <Pressable 
        style={[styles.actionBtn, styles.logoutBtn]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutBtnText}>LOGOUT</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.dark.gold,
    letterSpacing: 2,
    marginBottom: 16,
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: Colors.dark.cardBg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    width: '48%',
    padding: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.dark.gold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textDim,
  },
  actionBtn: {
    backgroundColor: Colors.dark.bg2,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionBtnText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '600',
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    borderColor: '#E57373',
    marginTop: 24,
  },
  logoutBtnText: {
    color: '#E57373',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});
