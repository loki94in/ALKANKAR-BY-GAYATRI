import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { addToSyncQueue } from './database';

export const BASE_URL = 'https://alkankar-by-gayatri.vercel.app';
export const ADMIN_TOKEN_KEY = 'admin_token';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(ADMIN_TOKEN_KEY);
      if (token) {
        config.headers['x-admin-token'] = token;
      }
    } catch (e) {
      console.warn('Failed to load admin token:', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, message } = error;
    
    // Check if it's a mutating request (POST, PUT, DELETE) and if it failed due to network connectivity
    const isMutation = config && ['post', 'put', 'delete'].includes(config.method?.toLowerCase() || '');
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || message?.toLowerCase().includes('network error');

    if (isMutation && isNetworkError) {
      try {
        const bodyStr = typeof config.data === 'string' 
          ? config.data 
          : JSON.stringify(config.data || {});
          
        addToSyncQueue(config.url || '', config.method || 'POST', bodyStr);
        
        // Resolve with a simulated 202 Accepted response for the UI to handle
        return {
          status: 202,
          data: { status: 'queued', message: 'Operation queued offline' },
          headers: {},
          config,
        };
      } catch (dbErr) {
        console.error('Failed to queue offline operation:', dbErr);
      }
    }
    
    return Promise.reject(error);
  }
);
