import axios from 'axios';
import toast from 'react-hot-toast';
import { clearAuthTokens, getStoredToken } from '../utils/authStorage';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

api.interceptors.request.use(config => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message || 'Something went wrong';

    if (error.response?.status === 401) {
      clearAuthTokens();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 429) {
      toast.error('Too many requests. Please wait.');
    }

    return Promise.reject(error);
  }
);

export default api;
