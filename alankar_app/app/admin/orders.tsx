import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, TextInput, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { api } from '../../services/api';
import { 
  getAllOrders, 
  addOrderLocal, 
  addToSyncQueue 
} from '../../services/database';
import { checkOnline, pullOrders } from '../../services/sync';

interface LocalDbOrder {
  id: string;
  date: string;
  name: string;
  phone: string;
  address: string;
  items: string;
  total: number;
  status: string;
}

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<LocalDbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Modal Detail State
  const [selectedOrder, setSelectedOrder] = useState<LocalDbOrder | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (shouldPull = true) => {
    try {
      setLoading(true);
      const isOnline = await checkOnline();
      if (isOnline && shouldPull) {
        await pullOrders();
      }
      
      const localOrders = getAllOrders();
      setOrders(localOrders);
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;
    
    setUpdating(true);
    try {
      const isOnline = await checkOnline();
      const updatedOrder = { ...selectedOrder, status: newStatus };
      
      // Update local SQLite immediately
      addOrderLocal(updatedOrder);
      setSelectedOrder(updatedOrder);

      const payload = { id: selectedOrder.id, status: newStatus };
      
      if (isOnline) {
        // Send PUT to remote backend
        await api.put('/api/orders', payload);
      } else {
        // Queue operation
        addToSyncQueue('/api/orders', 'PUT', JSON.stringify(payload));
        alert('Status updated locally. Will sync when online.');
      }
      
      // Reload list
      const localOrders = getAllOrders();
      setOrders(localOrders);
    } catch (e: any) {
      console.error(e);
      alert('Failed to update status: ' + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  const filteredOrders = orders.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#81C784';
      case 'cancelled': return '#E57373';
      default: return Colors.dark.gold;
    }
  };

  if (loading && orders.length === 0) {
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
          placeholder="Search by customer name or ID..."
          placeholderTextColor={Colors.dark.textMuted}
          style={styles.searchBar}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        renderItem={({ item }) => (
          <Pressable 
            style={styles.orderCard}
            onPress={() => {
              setSelectedOrder(item);
              setModalVisible(true);
            }}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>{item.id.toUpperCase()}</Text>
              <Text style={[styles.orderStatus, { color: getStatusColor(item.status) }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.customerName}>{item.name}</Text>
            <Text style={styles.orderDate}>{formatDate(item.date)}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.itemSummary} numberOfLines={1}>{item.items}</Text>
              <Text style={styles.orderTotal}>₹{item.total}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No enquiries/orders found.</Text>
          </View>
        }
      />

      {/* Order Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ORDER DETAILS</Text>
            
            {selectedOrder && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.infoSection}>
                  <Text style={styles.sectionLabel}>Order ID</Text>
                  <Text style={styles.sectionVal}>{selectedOrder.id.toUpperCase()}</Text>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.sectionLabel}>Date & Time</Text>
                  <Text style={styles.sectionVal}>{formatDate(selectedOrder.date)}</Text>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.sectionLabel}>Customer Details</Text>
                  <Text style={styles.sectionValName}>{selectedOrder.name}</Text>
                  <Text style={styles.sectionVal}>{selectedOrder.phone}</Text>
                  <Text style={styles.sectionVal}>{selectedOrder.address}</Text>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.sectionLabel}>Enquired Items</Text>
                  <Text style={styles.itemsBlock}>{selectedOrder.items}</Text>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.sectionLabel}>Total Price</Text>
                  <Text style={styles.totalPrice}>₹{selectedOrder.total}</Text>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.sectionLabel}>Current Status: {selectedOrder.status.toUpperCase()}</Text>
                  {updating ? (
                    <ActivityIndicator size="small" color={Colors.dark.gold} style={{ marginTop: 12 }} />
                  ) : (
                    <View style={styles.statusButtons}>
                      <Pressable 
                        style={[styles.statusBtn, selectedOrder.status === 'Pending' && styles.statusBtnActive]} 
                        onPress={() => handleStatusChange('Pending')}
                      >
                        <Text style={styles.statusBtnText}>PENDING</Text>
                      </Pressable>
                      <Pressable 
                        style={[styles.statusBtn, selectedOrder.status === 'Completed' && styles.statusBtnActive]} 
                        onPress={() => handleStatusChange('Completed')}
                      >
                        <Text style={styles.statusBtnText}>COMPLETED</Text>
                      </Pressable>
                      <Pressable 
                        style={[styles.statusBtn, selectedOrder.status === 'Cancelled' && styles.statusBtnActive]} 
                        onPress={() => handleStatusChange('Cancelled')}
                      >
                        <Text style={styles.statusBtnText}>CANCEL</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}

            <Pressable style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>CLOSE</Text>
            </Pressable>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  searchBar: {
    backgroundColor: Colors.dark.bg2,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 6,
    padding: 12,
    color: Colors.dark.text,
    fontSize: 14,
  },
  orderCard: {
    backgroundColor: Colors.dark.cardBg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderId: {
    color: Colors.dark.textDim,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  orderStatus: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  customerName: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderDate: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
    paddingTop: 12,
  },
  itemSummary: {
    color: Colors.dark.textDim,
    fontSize: 13,
    flex: 1,
    marginRight: 16,
  },
  orderTotal: {
    color: Colors.dark.gold,
    fontSize: 16,
    fontWeight: 'bold',
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
  modalBody: {
    marginBottom: 20,
  },
  infoSection: {
    marginBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
    paddingBottom: 16,
  },
  sectionLabel: {
    color: Colors.dark.gold,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sectionVal: {
    color: Colors.dark.text,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionValName: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemsBlock: {
    color: Colors.dark.text,
    fontSize: 14,
    lineHeight: 22,
    backgroundColor: Colors.dark.bg3,
    padding: 12,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: Colors.dark.border,
  },
  totalPrice: {
    color: Colors.dark.gold,
    fontSize: 22,
    fontWeight: 'bold',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  statusBtn: {
    flex: 1,
    backgroundColor: Colors.dark.bg3,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statusBtnActive: {
    borderColor: Colors.dark.gold,
    backgroundColor: 'rgba(212, 168, 67, 0.15)',
  },
  statusBtnText: {
    color: Colors.dark.text,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeBtn: {
    backgroundColor: Colors.dark.gold,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeBtnText: {
    color: Colors.dark.crimsonDark,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});
