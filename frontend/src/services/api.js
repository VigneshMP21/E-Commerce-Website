import axios from 'axios';
import toast from 'react-hot-toast';
import { clearAuthTokens, getStoredToken } from '../utils/authStorage';

const SEARCH_SESSION_KEY = 'vshop_search_session_id';

const getSearchSessionId = () => {
  if (typeof window === 'undefined') return '';

  try {
    const existing = window.localStorage.getItem(SEARCH_SESSION_KEY);
    if (existing) return existing;

    const next = window.crypto?.randomUUID?.()
      || `search-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(SEARCH_SESSION_KEY, next);
    return next;
  } catch {
    return '';
  }
};

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

api.interceptors.request.use(config => {
  const token = getStoredToken();
  const searchSessionId = getSearchSessionId();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (searchSessionId) {
    if (typeof config.headers.set === 'function') {
      config.headers.set('X-Search-Session-Id', searchSessionId);
    } else {
      config.headers['X-Search-Session-Id'] = searchSessionId;
    }
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else {
      delete config.headers['Content-Type'];
    }
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
