import io from 'socket.io-client';
import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

export const socket = io(BASE_URL);

export const api = {
  // Bağlantı Rotaları
  getConnections: () => axios.get(`${BASE_URL}/api/connections`),
  addConnection: (data) => axios.post(`${BASE_URL}/api/connections`, data),
  
  // Kural Rotaları
  getRules: () => axios.get(`${BASE_URL}/api/rules`),
  //addRule: (data) => axios.post(`${BASE_URL}/api/rules`, data),
  // src/services/api.js
  addRule: (ruleData) => axios.post(`${BASE_URL}/api/rules`, ruleData),
  deleteRule: (id) => axios.delete(`${BASE_URL}/api/rules/${id}`),

  // ETİKET (TAG) ROTALARI - Eksik olan veya hata veren kısım burası
  getTags: (connectionId) => axios.get(`${BASE_URL}/api/tags/${connectionId}`),
  addTag: (data) => axios.post(`${BASE_URL}/api/tags`, data),
  deleteTag: (id) => axios.delete(`${BASE_URL}/api/tags/${id}`),

  updateConnection: (id, data) => axios.put(`${BASE_URL}/api/connections/${id}`, data),

  updateRule: (id, data) => axios.put(`${BASE_URL}/api/rules/${id}`, data),

};

