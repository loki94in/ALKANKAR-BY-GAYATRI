import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, TextInput, Modal, Switch, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/Colors';
import { api } from '../../services/api';
import { 
  getAllProducts, 
  getAllCategories, 
  addProductLocal, 
  updateProductLocal, 
  deleteProductLocal, 
  DbProduct, 
  addToSyncQueue 
} from '../../services/database';
import { checkOnline } from '../../services/sync';

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [origPrice, setOrigPrice] = useState('');
  const [stock, setStock] = useState('');
  const [desc, setDesc] = useState('');
  const [featured, setFeatured] = useState(false);
  const [visible, setVisible] = useState(true);
  const [imageUri, setImageUri] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      setLoading(true);
      const prods = getAllProducts();
      const cats = getAllCategories();
      setProducts(prods);
      setCategories(cats);
      if (cats.length > 0 && !category) {
        setCategory(cats[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access gallery is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        
        let base64Data = asset.base64 || '';
        if (base64Data && !base64Data.startsWith('data:')) {
          const mime = asset.mimeType || 'image/jpeg';
          base64Data = `data:${mime};base64,${base64Data}`;
        }
        setImageBase64(base64Data);
        setImageMimeType(asset.mimeType || 'image/jpeg');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to pick image');
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setSelectedProductId(null);
    setName('');
    if (categories.length > 0) {
      setCategory(categories[0]);
    } else {
      setCategory('');
    }
    setPrice('');
    setOrigPrice('');
    setStock('');
    setDesc('');
    setFeatured(false);
    setVisible(true);
    setImageUri('');
    setImageBase64('');
    setModalVisible(true);
  };

  const openEditModal = (p: DbProduct) => {
    setIsEditMode(true);
    setSelectedProductId(p.id);
    setName(p.name);
    setCategory(p.category);
    setPrice(p.price.toString());
    setOrigPrice(p.origPrice ? p.origPrice.toString() : '');
    setStock(p.stock.toString());
    setDesc(p.desc);
    setFeatured(p.featured === 1);
    setVisible(p.visible === 1);
    setImageUri(p.image);
    setImageBase64('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name || !category || !price || !stock) {
      alert('Please fill all mandatory fields (Name, Category, Price, Stock)');
      return;
    }

    setSaving(true);
    try {
      const isOnline = await checkOnline();
      let finalImageUrl = imageUri;

      // 1. If online and we picked a new image, upload it
      if (isOnline && imageBase64) {
        try {
          const uploadRes = await api.post('/api/upload', {
            filename: `prod_${Date.now()}.jpg`,
            fileType: imageMimeType,
            base64: imageBase64,
          });
          if (uploadRes.data && uploadRes.data.url) {
            finalImageUrl = uploadRes.data.url;
          }
        } catch (uploadErr) {
          console.error('Image upload failed, using local URI:', uploadErr);
        }
      }

      const productPayload = {
        id: isEditMode ? selectedProductId : undefined,
        name,
        category,
        price: parseFloat(price),
        origPrice: origPrice ? parseFloat(origPrice) : null,
        stock: parseInt(stock) || 0,
        desc,
        visible,
        featured,
        image: finalImageUrl,
      };

      if (isOnline) {
        // Save via remote API
        await api.post('/api/products', productPayload);
        
        // Re-pull or sync will update SQLite, but let's update local SQLite immediately for instant UI update
        const localProduct: DbProduct = {
          id: isEditMode ? selectedProductId! : Date.now(), // Fallback local temp ID if creating, will sync on next pull
          name,
          category,
          price: parseFloat(price),
          origPrice: origPrice ? parseFloat(origPrice) : null,
          stock: parseInt(stock) || 0,
          desc,
          image: finalImageUrl,
          visible: visible ? 1 : 0,
          featured: featured ? 1 : 0,
        };

        if (isEditMode) {
          updateProductLocal(localProduct);
        } else {
          // Fetch catalog from server to get correct server-generated ID
          try {
            const pullRes = await api.get('/api/products');
            if (pullRes.data && Array.isArray(pullRes.data)) {
              // Seed local DB with server data
              const mapped = pullRes.data.map((p: any) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                price: p.price,
                origPrice: p.origPrice,
                stock: p.stock,
                desc: p.desc || '',
                image: p.image || '',
                visible: p.visible ? 1 : 0,
                featured: p.featured ? 1 : 0,
              }));
              addProductLocal(mapped[mapped.length - 1]); // Add newly created
            }
          } catch (e) {
            addProductLocal(localProduct);
          }
        }
      } else {
        // Offline Flow
        const tempId = isEditMode ? selectedProductId! : Date.now();
        const localProduct: DbProduct = {
          id: tempId,
          name,
          category,
          price: parseFloat(price),
          origPrice: origPrice ? parseFloat(origPrice) : null,
          stock: parseInt(stock) || 0,
          desc,
          image: imageUri, // Local uri
          visible: visible ? 1 : 0,
          featured: featured ? 1 : 0,
        };

        if (isEditMode) {
          updateProductLocal(localProduct);
        } else {
          addProductLocal(localProduct);
        }

        // If offline and have base64, embed base64 directly into payload so it syncs later!
        const queuedPayload = {
          ...productPayload,
          id: isEditMode ? selectedProductId : undefined,
          image: imageBase64 ? imageBase64 : imageUri,
        };
        
        addToSyncQueue('/api/products', 'POST', JSON.stringify(queuedPayload));
        alert('Saved locally. Will sync to server when online.');
      }

      setModalVisible(false);
      loadData();
    } catch (e: any) {
      console.error(e);
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const isOnline = await checkOnline();
      if (isOnline) {
        await api.delete(`/api/products?id=${id}`);
      } else {
        addToSyncQueue(`/api/products?id=${id}`, 'DELETE', '{}');
        alert('Deleted locally. Will sync to server when online.');
      }
      deleteProductLocal(id);
      loadData();
    } catch (e: any) {
      console.error(e);
      alert('Delete failed: ' + e.message);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TextInput
          placeholder="Search products..."
          placeholderTextColor={Colors.dark.textMuted}
          style={styles.searchBar}
          value={search}
          onChangeText={setSearch}
        />
        <Pressable style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add" size={20} color={Colors.dark.crimsonDark} />
          <Text style={styles.addBtnText}>ADD</Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.productRow}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.productImage} />
            ) : (
              <View style={[styles.productImage, styles.placeholderImage]}>
                <Text style={{ fontSize: 16 }}>✨</Text>
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productMeta}>{item.category} • ₹{item.price} • Stock: {item.stock}</Text>
              <View style={styles.badgeRow}>
                {item.featured === 1 && <Text style={styles.featuredBadge}>Featured</Text>}
                {item.visible === 1 ? (
                  <Text style={styles.visibleBadge}>Visible</Text>
                ) : (
                  <Text style={styles.hiddenBadge}>Hidden</Text>
                )}
              </View>
            </View>
            <View style={styles.actionRow}>
              <Pressable style={styles.editBtn} onPress={() => openEditModal(item)}>
                <Ionicons name="create-outline" size={18} color={Colors.dark.gold} />
              </Pressable>
              <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={18} color="#E57373" />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found.</Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditMode ? 'EDIT PRODUCT' : 'ADD PRODUCT'}</Text>
            
            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Kundan Choker"
                placeholderTextColor={Colors.dark.textMuted}
              />

              <Text style={styles.label}>Category *</Text>
              <View style={styles.pickerContainer}>
                {categories.map(cat => (
                  <Pressable
                    key={cat}
                    style={[styles.catOption, category === cat && styles.catOptionSelected]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.catOptionText, category === cat && styles.catOptionTextSelected]}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Price (₹) *</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="e.g. 1500"
                keyboardType="numeric"
                placeholderTextColor={Colors.dark.textMuted}
              />

              <Text style={styles.label}>Original Price (₹) (Optional)</Text>
              <TextInput
                style={styles.input}
                value={origPrice}
                onChangeText={setOrigPrice}
                placeholder="e.g. 1800"
                keyboardType="numeric"
                placeholderTextColor={Colors.dark.textMuted}
              />

              <Text style={styles.label}>Stock *</Text>
              <TextInput
                style={styles.input}
                value={stock}
                onChangeText={setStock}
                placeholder="e.g. 10"
                keyboardType="numeric"
                placeholderTextColor={Colors.dark.textMuted}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={desc}
                onChangeText={setDesc}
                placeholder="Description of the product..."
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.dark.textMuted}
              />

              <View style={styles.switchRow}>
                <Text style={styles.label}>Featured Product</Text>
                <Switch
                  value={featured}
                  onValueChange={setFeatured}
                  trackColor={{ false: '#2C2C2C', true: Colors.dark.gold }}
                  thumbColor={featured ? Colors.dark.crimsonDark : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Visible in Catalog</Text>
                <Switch
                  value={visible}
                  onValueChange={setVisible}
                  trackColor={{ false: '#2C2C2C', true: Colors.dark.gold }}
                  thumbColor={visible ? Colors.dark.crimsonDark : '#f4f3f4'}
                />
              </View>

              <Text style={styles.label}>Product Image</Text>
              <View style={styles.imagePickerRow}>
                <Pressable style={styles.pickImageBtn} onPress={pickImage}>
                  <Ionicons name="camera" size={20} color={Colors.dark.crimsonDark} />
                  <Text style={styles.pickImageBtnText}>Pick Image</Text>
                </Pressable>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                ) : (
                  <View style={[styles.previewImage, styles.placeholderImage]}>
                    <Text style={{ fontSize: 12, color: Colors.dark.textDim }}>No Image</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalBtn, styles.saveBtn]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.dark.crimsonDark} />
                ) : (
                  <Text style={styles.saveBtnText}>SAVE</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  headerRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    backgroundColor: Colors.dark.bg2,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 6,
    padding: 10,
    color: Colors.dark.text,
    fontSize: 14,
    marginRight: 12,
  },
  addBtn: {
    backgroundColor: Colors.dark.gold,
    borderRadius: 6,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBtnText: {
    color: Colors.dark.crimsonDark,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  productRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  placeholderImage: {
    backgroundColor: Colors.dark.bg3,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productName: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  productMeta: {
    color: Colors.dark.textDim,
    fontSize: 12,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  featuredBadge: {
    backgroundColor: Colors.dark.gold,
    color: Colors.dark.crimsonDark,
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  visibleBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    color: '#81C784',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hiddenBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    color: '#E57373',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBtn: {
    padding: 8,
    marginRight: 8,
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
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.bg2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalTitle: {
    color: Colors.dark.gold,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalForm: {
    marginBottom: 20,
  },
  label: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.dark.bg3,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 6,
    padding: 12,
    color: Colors.dark.text,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  catOption: {
    backgroundColor: Colors.dark.bg3,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  catOptionSelected: {
    borderColor: Colors.dark.gold,
    backgroundColor: 'rgba(212, 168, 67, 0.1)',
  },
  catOptionText: {
    color: Colors.dark.textDim,
    fontSize: 12,
  },
  catOptionTextSelected: {
    color: Colors.dark.gold,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  imagePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  pickImageBtn: {
    backgroundColor: Colors.dark.gold,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickImageBtnText: {
    color: Colors.dark.crimsonDark,
    fontSize: 12,
    fontWeight: 'bold',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cancelBtnText: {
    color: Colors.dark.textDim,
    fontSize: 13,
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: Colors.dark.gold,
  },
  saveBtnText: {
    color: Colors.dark.crimsonDark,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
