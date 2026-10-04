import axios from 'axios';
import { getLang } from '@/i18n/core';

export const TOKEN_KEY = 'token';
export const TOKEN_EXPIRES_KEY = 'token_expires_at';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', 'X-Platform': 'web' },
});

// Demo mode: requests never hit the network, they are answered by src/demo in the browser.
// The env check is inlined by Vite, so normal builds drop this branch and the demo chunk.
if (import.meta.env.VITE_DEMO_MODE === 'true') {
  api.defaults.adapter = async (config) => (await import('@/demo/adapter')).demoAdapter(config);
}

// Registered by the store so a 401 from any request logs the user out
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

api.interceptors.request.use((config) => {
  // Backend error titles/messages follow the UI language
  config.headers['Accept-Language'] = getLang();
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = error.config?.url?.includes('/auth/login');
    const status = error.response?.status;
    const code = error.response?.data?.error?.error_code;
    // Expired/invalid token, or the account was disabled while logged in
    if (!isLogin && (status === 401 || (status === 403 && code === 'err_user_inactive'))) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);
