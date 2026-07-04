import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, Pressable, ScrollView, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useStore } from '../../store/useStore';
import { getAllProducts, DbProduct } from '../../services/database';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<DbProduct | null>(null);

  const { addToCart, toggleFavorite, favorites } = useStore();

  useEffect(() => {
    if (id) {
      const allProducts = getAllProducts();
      const match = allProducts.find((p: DbProduct) => p.id.toString() === id);
      if (match) {
        setProduct(match);
      }
    }
  }, [id]);

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Product not found.</Text>
      </View>
    );
  }

  const isFav = favorites.includes(product.id);

  const shareProduct = async () => {
    const message = `Check out this gorgeous ${product.name} at Alankar by Gayatri!\n` +
      `Category: ${product.category}\n` +
      `Price: ₹${product.price}\n\n` +
      `Link: https://alkankar-by-gayatri.vercel.app/product?id=${product.id}`;
      
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>✨</Text>
          </View>
        )}
        <Pressable 
          style={styles.favBtn}
          onPress={() => toggleFavorite(product.id)}
        >
          <Ionicons 
            name={isFav ? "heart" : "heart-outline"} 
            size={24} 
            color={isFav ? "#E57373" : Colors.dark.gold} 
          />
        </Pressable>
      </View>

      {/* Info Body */}
      <View style={styles.detailsContainer}>
        <Text style={styles.categoryText}>{product.category.toUpperCase()}</Text>
        <Text style={styles.nameText}>{product.name}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>₹{product.price}</Text>
          {product.origPrice && (
            <Text style={styles.origPriceText}>₹{product.origPrice}</Text>
          )}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>DESCRIPTION</Text>
        <Text style={styles.descText}>{product.desc}</Text>

        <View style={styles.stockRow}>
          <Text style={styles.stockLabel}>Stock Available: </Text>
          <Text style={[
            styles.stockValue,
            product.stock > 5 ? styles.inStock : styles.lowStock
          ]}>
            {product.stock} items
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Buttons */}
        <View style={styles.btnRow}>
          <Pressable 
            style={[styles.btn, styles.shareBtn]} 
            onPress={shareProduct}
          >
            <Ionicons name="logo-whatsapp" size={20} color={Colors.dark.gold} />
            <Text style={styles.shareBtnText}>SHARE</Text>
          </Pressable>

          <Pressable 
            style={[styles.btn, styles.cartBtn]} 
            onPress={() => {
              addToCart(product.id);
              alert('Added to cart!');
            }}
          >
            <Ionicons name="cart-outline" size={20} color={Colors.dark.crimsonDark} />
            <Text style={styles.cartBtnText}>ADD TO BAG</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  content: {
    paddingBottom: 40,
  },
  errorText: {
    color: Colors.dark.textDim,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  imageContainer: {
    width: '100%',
    height: 320,
    position: 'relative',
    backgroundColor: Colors.dark.bg3,
  },
  image: {
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
    fontSize: 72,
  },
  favBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(26, 4, 4, 0.85)',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  detailsContainer: {
    padding: 24,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.textDim,
    letterSpacing: 2,
    marginBottom: 8,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '300',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.dark.gold,
  },
  origPriceText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    textDecorationLine: 'line-through',
    marginLeft: 10,
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.dark.border,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.dark.gold,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    color: Colors.dark.textDim,
    lineHeight: 22,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  stockLabel: {
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  stockValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  inStock: {
    color: Colors.dark.gold,
  },
  lowStock: {
    color: '#E57373',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    width: '48%',
  },
  shareBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.dark.gold,
  },
  shareBtnText: {
    color: Colors.dark.gold,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
  },
  cartBtn: {
    backgroundColor: Colors.dark.gold,
  },
  cartBtnText: {
    color: Colors.dark.crimsonDark,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
    letterSpacing: 1,
  },
});
