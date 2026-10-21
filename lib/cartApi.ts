import axios from 'axios';
import { API_URL } from './api';

const createCartApi = (sessionId: string) => {
  return axios.create({
    baseURL: API_URL + '/storefront/cart',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Session-ID': sessionId,
    },
  });
};

export const fetchActiveCart = async (sessionId: string) => {
  const response = await fetch(API_URL + '/storefront/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Session-ID': sessionId,
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch cart');
  }
  return response.json();
};

export const migrateLegacyCart = async (sessionId: string, legacyItems: any[]) => {
  const api = createCartApi(sessionId);
  const response = await api.post('/migrate', { items: legacyItems });
  return response.data;
};

export interface AddCartItemPayload {
  product_id: number | string;
  variant_id?: number | string | null;
  quantity: number;
  addons?: { product_addon_id: number | string; temp_file_id?: string | null }[];
}

export const addCartItem = async (sessionId: string, payload: AddCartItemPayload) => {
  const api = createCartApi(sessionId);
  const response = await api.post('/items', payload);
  return response.data;
};

export const updateCartItemQuantity = async (sessionId: string, cartItemId: number | string, quantity: number) => {
  const api = createCartApi(sessionId);
  const response = await api.put(`/items/${cartItemId}`, { quantity });
  return response.data;
};

export const removeCartItem = async (sessionId: string, cartItemId: number | string) => {
  const api = createCartApi(sessionId);
  const response = await api.delete(`/items/${cartItemId}`);
  return response.data;
};

export const applyCartCoupon = async (sessionId: string, code: string) => {
  const api = createCartApi(sessionId);
  const response = await api.post('/coupon', { code });
  return response.data;
};

export const removeCartCoupon = async (sessionId: string) => {
  const api = createCartApi(sessionId);
  const response = await api.delete('/coupon');
  return response.data;
};
