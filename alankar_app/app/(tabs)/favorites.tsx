import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useStore } from '../../store/useStore';
import { getAllProducts, DbProduct } from '../../services/database';

export default function FavoritesScreen() {
  const router = useRouter();
  const [favoriteProducts, setFavoriteProducts] = useState<DbProduct[]>([]);
  const { favorites, toggleFavorite, addToCart } = useStore();

  useEffect(() => {
    loadFavoriteDetails();
  }, [favorites]);

  const loadFavoriteDetails = () => {
    try {
      const allProducts = getAllProducts();
      const favProducts = allProducts.filter(p => favorites.includes(p.id));
      setFavoriteProducts(favProducts);
    } catch (e) {
      console.error('Failed to load favorites details:', e);
    }
  };

  const renderProductItem = ({ item }: { item: DbProduct }) => {
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
          <Pressable 
            style={styles.favBtn} 
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons name="heart" size={18} color="#E57373" />
          </Pressable>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
          <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>₹{item.price}</Text>
            <Pressable 
              style={styles.cartAddBtn}
              onPress={() => addToCart(item.id)}
            >
              <Ionicons name="cart-outline" size={14} color={Colors.dark.crimsonDark} />
              <Text style={styles.cartAddBtnText}>ADD</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={favoriteProducts}
        renderItem={renderProductItem}
        keyExtractor={(item: DbProduct) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={Colors.dark.textMuted} />
            <Text style={styles.emptyText}>No favorited items yet</Text>
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
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.gold,
  },
  cartAddBtn: {
    backgroundColor: Colors.dark.gold,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cartAddBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.dark.crimsonDark,
    marginLeft: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
  },
  emptyText: {
    color: Colors.dark.textDim,
    fontSize: 16,
    marginTop: 16,
  },
});
