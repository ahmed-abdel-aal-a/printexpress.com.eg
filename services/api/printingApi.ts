import axios from 'axios';
import { PrintOrderState } from '../../types/print-station'; // Adjust this import path later if needed
import { API_URL } from '../../lib/api';

const api = axios.create({
  baseURL: API_URL + '/storefront',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const sessionId = localStorage.getItem('X-Session-ID');
    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId;
    }
  }
  return config;
});

export const getPrintingProductTypes = async () => {
  const response = await api.get('printing-product-types');
  return response.data;
};

export const getPrintingTypeDetails = async (id: number) => {
  const response = await api.get(`printing-types/${id}`);
  return response.data;
};

export interface CalculatePricePayload {
  printing_type_id: number;
  quantity: number;
  selected_options: { value_id: number; multiplier_value?: number }[];
  width_mm?: number;
  length_mm?: number;
  image_count?: number;
}

export const calculateLivePrice = async (payload: CalculatePricePayload, signal?: AbortSignal) => {
  const response = await api.post('print/calculate-price', payload, { signal });
  return response.data;
};

export const checkFileStatus = async (cartItemId: number) => {
  const response = await api.get(`print/file-status/${cartItemId}`);
  return response.data;
};

export const deleteUnlinkedFile = async (cartItemId: number, category: string) => {
  const response = await api.delete(`print/files/${cartItemId}/${category}`);
  return response.data;
};

export const uploadPrintTempFile = async (
  file: File,
  category: string,
  sessionId: string,
  onUploadProgress?: (progressEvent: any) => void
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('session_id', sessionId);

  const response = await api.post('print/temp-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data; // { file_id, page_count, category }
};

export interface AddPrintJobPayload {
  printing_type_id: number;
  quantity: number;
  selected_options: { value_id: number; multiplier_value?: number }[];
  width_mm?: number;
  length_mm?: number;
  image_count?: number;
  notes?: string;
  temp_file_ids: string[];
  session_id: string;
}

export const addPrintJobToCart = async (payload: AddPrintJobPayload) => {
  const response = await api.post('print/add-to-cart', payload);
  return response.data;
};
