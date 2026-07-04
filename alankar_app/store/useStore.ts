import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';
import { getDb } from '../services/database';

export interface CartItem {
  productId: number;
  qty: number;
}

interface AppState {
  cart: CartItem[];
  favorites: number[];
  isOffline: boolean;
  
  // Cart Actions
  loadCart: () => void;
  addToCart: (productId: number, qty?: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartQty: (productId: number, qty: number) => void;
  clearCart: () => void;

  // Favorite Actions
  loadFavorites: () => void;
  toggleFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;

  // Offline status Actions
  setOfflineStatus: (status: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  cart: [],
  favorites: [],
  isOffline: false,

  loadCart: () => {
    try {
      const database = getDb();
      const rows = database.getAllSync<{ productId: number; qty: number }>('SELECT productId, qty FROM cart_items');
      set({ cart: rows });
    } catch (e) {
      console.error('Failed to load cart from SQLite:', e);
    }
  },

  addToCart: (productId, qty = 1) => {
    try {
      const database = getDb();
      const currentCart = get().cart;
      const existing = currentCart.find(item => item.productId === productId);
      
      let newCart;
      if (existing) {
        const newQty = existing.qty + qty;
        database.runSync('UPDATE cart_items SET qty = ? WHERE productId = ?', [newQty, productId]);
        newCart = currentCart.map(item => 
          item.productId === productId ? { ...item, qty: newQty } : item
        );
      } else {
        database.runSync('INSERT INTO cart_items (productId, qty) VALUES (?, ?)', [productId, qty]);
        newCart = [...currentCart, { productId, qty }];
      }
      set({ cart: newCart });
    } catch (e) {
      console.error('Failed to add to SQLite cart:', e);
    }
  },

  removeFromCart: (productId) => {
    try {
      const database = getDb();
      database.runSync('DELETE FROM cart_items WHERE productId = ?', [productId]);
      set({ cart: get().cart.filter(item => item.productId !== productId) });
    } catch (e) {
      console.error('Failed to remove from SQLite cart:', e);
    }
  },

  updateCartQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(productId);
      return;
    }
    try {
      const database = getDb();
      const currentCart = get().cart;
      const existing = currentCart.find(item => item.productId === productId);
      
      let newCart;
      if (existing) {
        database.runSync('UPDATE cart_items SET qty = ? WHERE productId = ?', [qty, productId]);
        newCart = currentCart.map(item => 
          item.productId === productId ? { ...item, qty } : item
        );
      } else {
        database.runSync('INSERT INTO cart_items (productId, qty) VALUES (?, ?)', [productId, qty]);
        newCart = [...currentCart, { productId, qty }];
      }
      set({ cart: newCart });
    } catch (e) {
      console.error('Failed to update SQLite cart qty:', e);
    }
  },

  clearCart: () => {
    try {
      const database = getDb();
      database.runSync('DELETE FROM cart_items');
      set({ cart: [] });
    } catch (e) {
      console.error('Failed to clear SQLite cart:', e);
    }
  },

  loadFavorites: () => {
    try {
      const database = getDb();
      const rows = database.getAllSync<{ productId: number }>('SELECT productId FROM favorites');
      set({ favorites: rows.map(r => r.productId) });
    } catch (e) {
      console.error('Failed to load favorites from SQLite:', e);
    }
  },

  toggleFavorite: (productId) => {
    try {
      const database = getDb();
      const currentFavs = get().favorites;
      const isFav = currentFavs.includes(productId);
      
      if (isFav) {
        database.runSync('DELETE FROM favorites WHERE productId = ?', [productId]);
        set({ favorites: currentFavs.filter(id => id !== productId) });
      } else {
        database.runSync('INSERT INTO favorites (productId) VALUES (?)', [productId]);
        set({ favorites: [...currentFavs, productId] });
      }
    } catch (e) {
      console.error('Failed to toggle SQLite favorite:', e);
    }
  },

  isFavorite: (productId) => {
    return get().favorites.includes(productId);
  },

  setOfflineStatus: (isOffline) => {
    set({ isOffline });
  }
}));
