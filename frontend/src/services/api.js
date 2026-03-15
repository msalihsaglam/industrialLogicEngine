import io from 'socket.io-client';
import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

// 1. Socket.io Bağlantısı
export const socket = io(BASE_URL);

// 2. Axios Instance (Merkezi Yapı)
const instance = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// 3. Güvenlik Kapısı (Interceptors)
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 4. API Nesnesi
export const api = {
  // --- GENEL METODLAR ---
  get: (url) => instance.get(url),
  post: (url, data) => instance.post(url, data),
  put: (url, data) => instance.put(url, data),
  delete: (url) => instance.delete(url),

  // --- BAĞLANTI (CONNECTION) ROTALARI ---
  getConnections: () => instance.get('/connections'),
  addConnection: (data) => instance.post('/connections', data),
  updateConnection: (id, data) => instance.put(`/connections/${id}`, data),
  deleteConnection: (id) => instance.delete(`/connections/${id}`),

  // --- KURAL (RULE) ROTALARI ---
  getRules: (userId) => instance.get(`/rules${userId ? `?userId=${userId}` : ''}`),
  addRule: (ruleData) => instance.post('/rules', ruleData),
  updateRule: (id, data) => instance.put(`/rules/${id}`, data),
  deleteRule: (id) => instance.delete(`/rules/${id}`),

  // --- ETİKET (TAG) ROTALARI ---
  getTags: (connectionId) => instance.get(`/tags/${connectionId}`),
  addTag: (data) => instance.post('/tags', data),
  updateTag: (id, data) => instance.put(`/tags/${id}`, data), // 🎯 axios yerine instance kullanıldı
  deleteTag: (id) => instance.delete(`/tags/${id}`),

  // --- DASHBOARD PERSISTENCE ---
  getDashboard: (userId) => instance.get(`/dashboard/${userId}`),
  saveDashboard: (userId, layout) => instance.post('/dashboard/save', { userId, layout }),

  // 📊 --- ANALYTICS & REPORTS (Yeni İstasyonumuz) ---
  // Enerji tüketimi için saatlik delta farklarını getirir
  getEnergyDelta: (tagId) => instance.get(`/reports/energy-delta?tagId=${tagId}`),
  
  // Belirli bir tarih aralığındaki ham verileri getirir
  getHistory: (tagId, start, end) => instance.get('/reports/history', { 
    params: { tagIds: tagId, start, end } 
  }),
};

export default api;