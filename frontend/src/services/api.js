import io from 'socket.io-client';
import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

export const socket = io(BASE_URL);

export const api = {
  getRules: () => axios.get(`${BASE_URL}/api/rules`),
  addRule: (data) => axios.post(`${BASE_URL}/api/rules`, data),
  deleteRule: (id) => axios.delete(`${BASE_URL}/api/rules/${id}`),
  getConnections: () => axios.get(`${BASE_URL}/api/connections`),
  addConnection: (data) => axios.post(`${BASE_URL}/api/connections`, data),
};