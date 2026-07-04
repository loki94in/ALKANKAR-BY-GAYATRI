import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { api } from '../../services/api';
import { 
  getAllCategories, 
  addCategoryLocal, 
  deleteCategoryLocal, 
  addToSyncQueue 
} from '../../services/database';
import { checkOnline } from '../../services/sync';

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newCatName, setNewCatName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      setLoading(true);
      const cats = getAllCategories();
      setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (categories.includes(trimmed)) {
      alert('Category already exists');
      return;
    }

    setSaving(true);
    try {
      const isOnline = await checkOnline();
      
      // Save locally immediately
      addCategoryLocal(trimmed);
      
      if (isOnline) {
        // Post to remote server
        await api.post('/api/categories', { name: trimmed });
      } else {
        // Queue operation
        addToSyncQueue('/api/categories', 'POST', JSON.stringify({ name: trimmed }));
        alert('Added locally. Will sync when online.');
      }
      
      setNewCatName('');
      loadData();
    } catch (e: any) {
      console.error(e);
      alert('Failed to add category: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

    try {
      const isOnline = await checkOnline();
      
      // Delete locally immediately
      deleteCategoryLocal(name);
      
      if (isOnline) {
        // Delete from remote server
        await api.delete(`/api/categories?name=${encodeURIComponent(name)}`);
      } else {
        // Queue operation
        addToSyncQueue(`/api/categories?name=${encodeURIComponent(name)}`, 'DELETE', '{}');
        alert('Deleted locally. Will sync when online.');
      }
      
      loadData();
    } catch (e: any) {
      console.error(e);
      alert('Failed to delete category: ' + e.message);
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
    <View style={styles.container}>
      <View style={styles.addForm}>
        <TextInput
          placeholder="New category name..."
          placeholderTextColor={Colors.dark.textMuted}
          style={styles.input}
          value={newCatName}
          onChangeText={setNewCatName}
        />
        <Pressable 
          style={styles.addBtn} 
          onPress={handleAddCategory}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.dark.crimsonDark} />
          ) : (
            <>
              <Ionicons name="add" size={20} color={Colors.dark.crimsonDark} />
              <Text style={styles.addBtnText}>ADD</Text>
            </>
          )}
        </Pressable>
      </View>

      <FlatList
        data={categories}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <View style={styles.catRow}>
            <Text style={styles.catName}>{item}</Text>
            <Pressable style={styles.deleteBtn} onPress={() => handleDeleteCategory(item)}>
              <Ionicons name="trash-outline" size={18} color="#E57373" />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No categories defined yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addForm: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.dark.bg2,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 6,
    padding: 12,
    color: Colors.dark.text,
    fontSize: 14,
    marginRight: 12,
  },
  addBtn: {
    backgroundColor: Colors.dark.gold,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
    justifyContent: 'center',
  },
  addBtnText: {
    color: Colors.dark.crimsonDark,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  catRow: {
    flexDirection: 'row',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catName: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: Colors.dark.textDim,
    textAlign: 'center',
  },
});
