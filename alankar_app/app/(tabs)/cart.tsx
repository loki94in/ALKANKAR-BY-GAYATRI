import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, TextInput, Modal, Linking, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useStore, CartItem } from '../../store/useStore';
import { getAllProducts, DbProduct } from '../../services/database';
import { api, BASE_URL } from '../../services/api';

interface CartItemWithProduct extends CartItem {
  product: DbProduct;
}

export default function CartScreen() {
  const params = useLocalSearchParams<{ cartId?: string }>();
  const sharedCartId = params.cartId;

  const { cart, removeFromCart, updateCartQty, clearCart } = useStore();
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [itemsWithProducts, setItemsWithProducts] = useState<CartItemWithProduct[]>([]);
  const [isSharedCart, setIsSharedCart] = useState(false);
  const [sharedLoading, setSharedLoading] = useState(false);

  // Enquiry modal form state
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Load local products list to resolve cart items details
    const localProds = getAllProducts();
    setProducts(localProds);
  }, [cart]);

  useEffect(() => {
    if (sharedCartId) {
      setIsSharedCart(true);
      fetchSharedCart(sharedCartId);
    } else {
      setIsSharedCart(false);
      // Map local cart items to product details
      mapLocalCartItems();
    }
  }, [sharedCartId, cart, products]);

  const mapLocalCartItems = () => {
    const localProds = products.length > 0 ? products : getAllProducts();
    const mapped = cart.map((item: CartItem) => {
      const product = localProds.find((p: DbProduct) => p.id === item.productId);
      return product ? { ...item, product } : null;
    }).filter((item): item is CartItemWithProduct => item !== null);
    
    setItemsWithProducts(mapped);

    // Clean up orphaned cart items that no longer exist in the database
    const validProductIds = localProds.map(p => p.id);
    const orphanedItems = cart.filter(item => !validProductIds.includes(item.productId));
    if (orphanedItems.length > 0) {
      for (const orphan of orphanedItems) {
        removeFromCart(orphan.productId);
      }
    }
  };

  const fetchSharedCart = async (cartId: string) => {
    try {
      setSharedLoading(true);
      const res = await api.get(`/api/carts?id=${cartId}`);
      
      let sharedItems: any[] = [];
      if (Array.isArray(res.data)) {
        sharedItems = res.data;
      } else if (res.data && Array.isArray(res.data.items)) {
        sharedItems = res.data.items;
      }
      
      if (sharedItems.length > 0) {
        const localProds = products.length > 0 ? products : getAllProducts();
        
        const mapped = sharedItems.map((item: any) => {
          const prodId = item.productId ?? item.id;
          const product = localProds.find((p: DbProduct) => p.id === prodId);
          return product ? { productId: prodId, qty: item.qty, product } : null;
        }).filter((item): item is CartItemWithProduct => item !== null);
        
        setItemsWithProducts(mapped);
      } else {
        setItemsWithProducts([]);
      }
    } catch (e) {
      console.error('Failed to fetch shared cart details:', e);
    } finally {
      setSharedLoading(false);
    }
  };

  const calculateTotal = () => {
    return itemsWithProducts.reduce((sum: number, item: CartItemWithProduct) => sum + (item.product.price * item.qty), 0);
  };

  const handleQtyChange = (productId: number, newQty: number) => {
    if (isSharedCart) return; // Shared carts are read-only until copied to local
    updateCartQty(productId, newQty);
  };

  const handleCheckout = async () => {
    if (itemsWithProducts.length === 0) return;
    setModalVisible(true);
  };

  const submitEnquiry = async () => {
    if (!name || !phone || !address) {
      alert('Please fill in all the details');
      return;
    }

    setSubmitting(true);
    try {
      const orderItemsText = itemsWithProducts
        .map((item: CartItemWithProduct) => `${item.product.name} (Qty: ${item.qty})`)
        .join(', ');
      
      const totalAmount = calculateTotal();

      // 1. Submit to Backend API
      await api.post('/api/order', {
        name,
        phone,
        address,
        items: orderItemsText,
        total: totalAmount,
      });

      // 2. Open WhatsApp with formatted text
      const whatsAppMsg = `Hello Gayatri, I would like to enquire about: \n\n` +
        itemsWithProducts.map((item: CartItemWithProduct) => `- ${item.product.name} x${item.qty} (₹${item.product.price * item.qty})`).join('\n') +
        `\n\nTotal: ₹${totalAmount}\n` +
        `Name: ${name}\n` +
        `Phone: ${phone}\n` +
        `Address: ${address}`;

      const whatsappNumber = '919876543210'; // Default fallback, settings should override
      const whatsappUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(whatsAppMsg)}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        const webUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsAppMsg)}`;
        await Linking.openURL(webUrl);
      }

      // Clear local cart
      if (!isSharedCart) {
        clearCart();
      }

      setModalVisible(false);
      setName('');
      setPhone('');
      setAddress('');
      
      alert('Enquiry submitted successfully!');
    } catch (e) {
      console.error('Failed to submit enquiry:', e);
      alert('Failed to submit enquiry. It has been queued offline.');
    } finally {
      setSubmitting(false);
    }
  };

  const importSharedCart = () => {
    // Copy shared cart items to local cart
    for (const item of itemsWithProducts) {
      updateCartQty(item.product.id, item.qty);
    }
    alert('Items copied to your local cart!');
    setIsSharedCart(false);
  };

  const renderCartItem = ({ item }: { item: CartItemWithProduct }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.nameText}>{item.product.name}</Text>
          <Text style={styles.categoryText}>{item.product.category}</Text>
          <Text style={styles.priceText}>₹{item.product.price} each</Text>
        </View>
        
        <View style={styles.controlsRow}>
          {!isSharedCart && (
            <Pressable 
              style={styles.deleteBtn}
              onPress={() => removeFromCart(item.product.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#E57373" />
            </Pressable>
          )}

          <View style={styles.qtyContainer}>
            {!isSharedCart && (
              <Pressable 
                style={styles.qtyBtn}
                onPress={() => handleQtyChange(item.product.id, item.qty - 1)}
              >
                <Ionicons name="remove" size={16} color={Colors.dark.gold} />
              </Pressable>
            )}
            <Text style={styles.qtyText}>{item.qty}</Text>
            {!isSharedCart && (
              <Pressable 
                style={styles.qtyBtn}
                onPress={() => handleQtyChange(item.product.id, item.qty + 1)}
              >
                <Ionicons name="add" size={16} color={Colors.dark.gold} />
              </Pressable>
            )}
          </View>

          <Text style={styles.itemTotalText}>₹{item.product.price * item.qty}</Text>
        </View>
      </View>
    );
  };

  if (sharedLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Fetching shared cart details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isSharedCart && (
        <View style={styles.sharedBanner}>
          <Text style={styles.sharedBannerText}>Viewing a Shared Cart</Text>
          <Pressable style={styles.importBtn} onPress={importSharedCart}>
            <Text style={styles.importBtnText}>Import to My Cart</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={itemsWithProducts}
        renderItem={renderCartItem}
        keyExtractor={(item: CartItemWithProduct) => item.product.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color={Colors.dark.textMuted} />
            <Text style={styles.emptyText}>Your cart is empty</Text>
          </View>
        }
      />

      {itemsWithProducts.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total:</Text>
            <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
          </View>
          
          <Pressable style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutBtnText}>ENQUIRE VIA WHATSAPP</Text>
          </Pressable>
        </View>
      )}

      {/* Enquiry Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>SUBMIT ENQUIRY</Text>
            <Text style={styles.modalSubtitle}>Enter details to finalize order on WhatsApp</Text>
            
            <TextInput
              placeholder="Your Name"
              placeholderTextColor={Colors.dark.textMuted}
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
            
            <TextInput
              placeholder="Phone Number"
              placeholderTextColor={Colors.dark.textMuted}
              style={styles.input}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            
            <TextInput
              placeholder="Shipping Address"
              placeholderTextColor={Colors.dark.textMuted}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={4}
              value={address}
              onChangeText={setAddress}
            />

            <View style={styles.modalBtns}>
              <Pressable 
                style={[styles.modalBtn, styles.modalBtnCancel]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.modalBtn, styles.modalBtnConfirm]} 
                onPress={submitEnquiry}
                disabled={submitting}
              >
                <Text style={styles.modalBtnConfirmText}>
                  {submitting ? 'Submitting...' : 'Send'}
                </Text>
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
  loadingText: {
    color: Colors.dark.gold,
    fontSize: 16,
  },
  sharedBanner: {
    backgroundColor: Colors.dark.bg2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sharedBannerText: {
    color: Colors.dark.gold,
    fontSize: 13,
    fontWeight: 'bold',
  },
  importBtn: {
    backgroundColor: Colors.dark.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  importBtnText: {
    color: Colors.dark.crimsonDark,
    fontSize: 11,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.dark.cardBg,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cardInfo: {
    marginBottom: 12,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  categoryText: {
    fontSize: 11,
    color: Colors.dark.textDim,
    marginTop: 2,
  },
  priceText: {
    fontSize: 13,
    color: Colors.dark.gold,
    marginTop: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
    paddingTop: 12,
  },
  deleteBtn: {
    padding: 4,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.bg3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.dark.border,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    paddingHorizontal: 8,
  },
  itemTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.gold,
  },
  footer: {
    backgroundColor: Colors.dark.bg2,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    padding: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.dark.gold,
  },
  checkoutBtn: {
    backgroundColor: Colors.dark.gold,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: Colors.dark.crimsonDark,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: Colors.dark.textDim,
    fontSize: 16,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.dark.bg2,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.dark.gold,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.gold,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.dark.textDim,
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: Colors.dark.bg3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 12,
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalBtn: {
    borderRadius: 6,
    paddingVertical: 12,
    width: '48%',
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalBtnCancelText: {
    color: Colors.dark.textDim,
    fontSize: 14,
    fontWeight: '600',
  },
  modalBtnConfirm: {
    backgroundColor: Colors.dark.gold,
  },
  modalBtnConfirmText: {
    color: Colors.dark.crimsonDark,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
