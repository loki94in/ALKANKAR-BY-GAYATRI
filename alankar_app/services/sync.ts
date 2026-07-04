import { api } from './api';
import { 
  getQueuedSyncItems, 
  deleteSyncItem, 
  incrementSyncRetry, 
  saveProducts, 
  saveCategories, 
  saveOrders,
  DbProduct,
  DbOrder
} from './database';
import * as SecureStore from 'expo-secure-store';

export const SETTINGS_WHATSAPP_KEY = 'settings_whatsapp_number';
export const SETTINGS_INSTAGRAM_KEY = 'settings_instagram_handle';

// Simple network check using the /api/settings endpoint
export async function checkOnline(): Promise<boolean> {
  try {
    const res = await api.get('/api/settings', { timeout: 3000 });
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

// Replays all queued mutating actions
export async function replaySyncQueue(): Promise<boolean> {
  const queuedItems = getQueuedSyncItems();
  if (queuedItems.length === 0) return true;

  console.log(`Replaying ${queuedItems.length} queued operations...`);
  
  for (const item of queuedItems) {
    try {
      let data = JSON.parse(item.body);
      
      // If offline queued product has base64 image, upload it first
      if (item.endpoint === '/api/products' && data.image && data.image.startsWith('data:image')) {
        console.log('Sync Engine: Uploading offline queued image...');
        try {
          const mime = data.image.substring(data.image.indexOf(':') + 1, data.image.indexOf(';'));
          const uploadRes = await api.post('/api/upload', {
            filename: `prod_${Date.now()}.jpg`,
            fileType: mime,
            base64: data.image
          });
          if (uploadRes.data && uploadRes.data.url) {
            data.image = uploadRes.data.url;
            console.log('Sync Engine: Image uploaded successfully to:', data.image);
          }
        } catch (uploadErr) {
          console.warn('Sync Engine: Queued image upload failed, using original base64/uri', uploadErr);
        }
      }

      // Re-run the API request
      const response = await api.request({
        url: item.endpoint,
        method: item.method,
        data,
      });

      if (response.status === 200 || response.status === 201 || response.status === 202) {
        // Success, remove from local queue
        deleteSyncItem(item.id);
      } else {
        // Bad request or authorization issue, increment retry
        incrementSyncRetry(item.id, item.retries + 1);
      }
    } catch (err: any) {
      console.warn(`Failed to replay queued item ID ${item.id}:`, err.message);
      // If it's a network error, stop replaying (still offline)
      if (!err.response || err.code === 'ERR_NETWORK') {
        return false;
      }
      // If it's a 4xx error (validation or authorization), skip it so it doesn't block the queue forever
      if (err.response && err.response.status >= 400 && err.response.status < 500) {
        deleteSyncItem(item.id);
      } else {
        incrementSyncRetry(item.id, item.retries + 1);
      }
    }
  }
  return true;
}

// Pulls the latest products and categories
export async function pullCatalog(): Promise<boolean> {
  try {
    // 1. Pull products
    const productsRes = await api.get('/api/products');
    if (productsRes.data && Array.isArray(productsRes.data)) {
      const dbProds: DbProduct[] = productsRes.data.map((p: any) => ({
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
      saveProducts(dbProds);
    }

    // 2. Pull categories
    const categoriesRes = await api.get('/api/categories');
    if (categoriesRes.data && Array.isArray(categoriesRes.data)) {
      saveCategories(categoriesRes.data);
    }

    // 3. Pull settings
    const settingsRes = await api.get('/api/settings');
    if (settingsRes.data) {
      const whatsapp = settingsRes.data.whatsapp_number || '';
      const instagram = settingsRes.data.instagram_handle || '';
      await SecureStore.setItemAsync(SETTINGS_WHATSAPP_KEY, whatsapp);
      await SecureStore.setItemAsync(SETTINGS_INSTAGRAM_KEY, instagram);
    }

    return true;
  } catch (e: any) {
    console.error('Failed to pull catalog:', e.message);
    return false;
  }
}

// Pulls orders from server (requires Admin Authentication)
export async function pullOrders(): Promise<boolean> {
  try {
    const ordersRes = await api.get('/api/orders');
    if (ordersRes.data && Array.isArray(ordersRes.data)) {
      const dbOrders: DbOrder[] = ordersRes.data.map((o: any) => ({
        id: o.id,
        date: o.date,
        name: o.name,
        phone: o.phone,
        address: o.address,
        items: o.items || '',
        total: o.total || 0,
        status: o.status || 'Pending',
      }));
      saveOrders(dbOrders);
      return true;
    }
    return false;
  } catch (e: any) {
    console.error('Failed to pull orders:', e.message);
    return false;
  }
}

// Global synchronization orchestrator
export async function runSync(isAdminLoggedIn: boolean = false): Promise<boolean> {
  const isOnline = await checkOnline();
  if (!isOnline) {
    console.log('App is offline. Skipping remote sync.');
    return false;
  }

  // 1. Push local changes
  await replaySyncQueue();

  // 2. Pull catalog
  const catalogSuccess = await pullCatalog();

  // 3. Pull admin orders if logged in
  if (isAdminLoggedIn && catalogSuccess) {
    await pullOrders();
  }

  return true;
}
