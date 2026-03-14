import io from 'socket.io-client';
import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:3001/api';

// 1. Socket.io Bağlantısı
export const socket = io(BASE_URL);

// 2. Axios Instance (Merkezi Yapı)
const instance = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// 3. Güvenlik Kapısı (Interceptors)
// Her istekte localStorage'daki token'ı kontrol eder ve varsa kafasına yapıştırır
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 4. API Nesnesi
export const api = {
  // --- GENEL METODLAR (Login/Register için şart!) ---
  get: (url) => instance.get(url),
  post: (url, data) => instance.post(url, data),
  put: (url, data) => instance.put(url, data),
  delete: (url) => instance.delete(url),

  // --- BAĞLANTI (CONNECTION) ROTALARI ---
  getConnections: () => instance.get('/connections'),
  addConnection: (data) => instance.post('/connections', data),
  updateConnection: (id, data) => instance.put(`/connections/${id}`, data),
  deleteConnection: (id) => instance.delete(`/connections/${id}`),

  // --- KURAL (RULE) ROTALARI (Kanka ruleRoutes demiştik unutma!) ---
  getRules: (userId) => instance.get(`/rules${userId ? `?userId=${userId}` : ''}`),
  addRule: (ruleData) => instance.post('/rules', ruleData),
  updateRule: (id, data) => instance.put(`/rules/${id}`, data),
  deleteRule: (id) => instance.delete(`/rules/${id}`),

  // --- ETİKET (TAG) ROTALARI ---
  getTags: (connectionId) => instance.get(`/tags/${connectionId}`),
  addTag: (data) => instance.post('/tags', data),
  deleteTag: (id) => instance.delete(`/tags/${id}`),

  // --- DASHBOARD PERSISTENCE (Yeni vizyonumuz!) ---
  getDashboard: (userId) => instance.get(`/dashboard/${userId}`),
  saveDashboard: (userId, layout) => instance.post('/dashboard/save', { userId, layout }),

  // 🎯 YENİ: Tag bilgilerini (Historian dahil) güncelleme metodu
  updateTag: (id, data) => axios.put(`${API_URL}/tags/${id}`, data),
};

export default api;