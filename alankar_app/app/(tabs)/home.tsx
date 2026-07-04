import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useStore } from '../../store/useStore';
import { getAllProducts, saveProducts, getAllCategories, saveCategories, DbProduct } from '../../services/database';
import { runSync, checkOnline } from '../../services/sync';

export default function HomeScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const { addToCart, toggleFavorite, favorites, setOfflineStatus } = useStore();

  useEffect(() => {
    loadLocalCatalog();
    handleSync();
  }, []);

  const handleSync = async () => {
    try {
      const online = await checkOnline();
      setIsOfflineMode(!online);
      setOfflineStatus(!online);
      if (online) {
        setRefreshing(true);
        await runSync();
        loadLocalCatalog();
      }
    } catch (e) {
      console.error('Sync failed on Home launch/refresh:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const loadLocalCatalog = () => {
    try {
      setLoading(false); // Disable initial full screen loading blocker if catalog already has items
      let localProducts = getAllProducts();
      let localCategories = getAllCategories();


      // If local DB is empty, seed it with the default website items
      if (localProducts.length === 0) {
        const defaultProducts: DbProduct[] = [
          {
            id: 2,
            name: "Meenakari Jhumkas",
            category: "Earrings",
            price: 1250,
            origPrice: null,
            stock: 15,
            desc: "Vibrant meenakari jhumka earrings with intricate enamel detailing.",
            image: "",
            visible: 1,
            featured: 0
          },
          {
            id: 3,
            name: "Bridal Bangles Set",
            category: "Bangles",
            price: 2800,
            origPrice: 3200,
            stock: 5,
            desc: "Gold-finish bridal bangles set of 12, perfect for ceremonies.",
            image: "",
            visible: 0,
            featured: 1
          },
          {
            id: 4,
            name: "Temple Necklace",
            category: "Necklaces",
            price: 5500,
            origPrice: null,
            stock: 4,
            desc: "South Indian temple jewellery necklace with antique gold finish.",
            image: "",
            visible: 1,
            featured: 0
          },
          {
            id: 5,
            name: "Maang Tikka",
            category: "Hair Accessories",
            price: 980,
            origPrice: 1200,
            stock: 12,
            desc: "Elegant maang tikka with pearl and stone work.",
            image: "",
            visible: 1,
            featured: 0
          },
          {
            id: 6,
            name: "Oxidised Haath Phool",
            category: "Bridal",
            price: 1600,
            origPrice: null,
            stock: 7,
            desc: "Oxidised silver finish haath phool with floral motifs.",
            image: "",
            visible: 1,
            featured: 0
          },
          {
            id: 7,
            name: "Stone Rings Set",
            category: "Rings",
            price: 650,
            origPrice: null,
            stock: 20,
            desc: "Set of 3 stone-studded rings with adjustable bands.",
            image: "",
            visible: 1,
            featured: 0
          },
          {
            id: 8,
            name: "Ghungroo Anklets",
            category: "Anklets",
            price: 750,
            origPrice: 900,
            stock: 10,
            desc: "Traditional payal with brass ghungroo bells.",
            image: "",
            visible: 1,
            featured: 0
          }
        ];
        
        const defaultCategories = ["Necklaces", "Earrings", "Bangles", "Rings", "Hair Accessories", "Anklets", "Bridal"];
        
        saveProducts(defaultProducts);
        saveCategories(defaultCategories);
        
        localProducts = defaultProducts;
        localCategories = defaultCategories;
      }

      setProducts(localProducts.filter(p => p.visible === 1 || p.featured === 1));
      setCategories(['All', ...localCategories]);
    } catch (e) {
      console.error('Error loading catalog:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter((p: DbProduct) => p.category === selectedCategory);

  const renderProductItem = ({ item }: { item: DbProduct }) => {
    const isFav = favorites.includes(item.id);
    
    return (
      <Pressable 
        style={styles.card}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <View style={styles.cardImageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.cardImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>✨</Text>
            </View>
          )}
          {item.featured === 1 && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>FEATURED</Text>
            </View>
          )}
          <Pressable 
            style={styles.favBtn} 
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons 
              name={isFav ? "heart" : "heart-outline"} 
              size={18} 
              color={isFav ? "#E57373" : Colors.dark.gold} 
            />
          </Pressable>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
          <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
          
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceText}>₹{item.price}</Text>
              {item.origPrice && (
                <Text style={styles.origPriceText}>₹{item.origPrice}</Text>
              )}
            </View>
            <Pressable 
              style={styles.cartAddBtn}
              onPress={() => addToCart(item.id)}
            >
              <Ionicons name="cart-outline" size={16} color={Colors.dark.crimsonDark} />
              <Text style={styles.cartAddBtnText}>ADD</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
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
      {isOfflineMode && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>OFFLINE MODE — Showing cached catalog</Text>
        </View>
      )}

      {/* Category List horizontal scroll */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item: string) => item}
          renderItem={({ item }: { item: string }) => {
            const isActive = selectedCategory === item;
            return (
              <Pressable
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                  {item.toUpperCase()}
                </Text>
              </Pressable>
            );
          }}
          contentContainerStyle={styles.categoriesInner}
        />
      </View>

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item: DbProduct) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContainer}
        refreshing={refreshing}
        onRefresh={handleSync}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found in this category.</Text>
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
  categoriesContainer: {
    backgroundColor: Colors.dark.bg2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    paddingVertical: 12,
  },
  categoriesInner: {
    paddingHorizontal: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    marginHorizontal: 4,
  },
  categoryChipActive: {
    borderColor: Colors.dark.gold,
    backgroundColor: Colors.dark.bg3,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.textDim,
    letterSpacing: 1.5,
  },
  categoryChipTextActive: {
    color: Colors.dark.gold,
  },
  gridContainer: {
    padding: 8,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: Colors.dark.cardBg,
    borderRadius: 8,
    width: '48.5%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  cardImageContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
    backgroundColor: Colors.dark.bg3,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.dark.gold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.dark.crimsonDark,
    letterSpacing: 1,
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(26, 4, 4, 0.7)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: Colors.dark.border,
  },
  cardContent: {
    padding: 12,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.dark.textDim,
    letterSpacing: 1,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.gold,
  },
  origPriceText: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  cartAddBtn: {
    backgroundColor: Colors.dark.gold,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  cartAddBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dark.crimsonDark,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: Colors.dark.textDim,
    textAlign: 'center',
  },
  offlineBanner: {
    backgroundColor: '#E57373',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#1A1A1A',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
