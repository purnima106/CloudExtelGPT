import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth tokens if needed
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// UI-only mode: backend disabled. The following helper stubs intentionally
// reject so the UI can show a friendly message without making network calls.

export const uploadExcelFile = async () => {
  return Promise.reject(new Error('Feature disabled: backend is turned off in UI-only mode.'));
};

export const getDataPreview = async () => {
  return Promise.reject(new Error('Feature disabled: backend is turned off in UI-only mode.'));
};

export const generateVisualization = async () => {
  return Promise.reject(new Error('Feature disabled: backend is turned off in UI-only mode.'));
};

