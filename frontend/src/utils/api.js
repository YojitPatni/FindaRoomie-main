import axios from 'axios';

// Use relative baseURL to route through Vite's proxy (see vite.config.js)
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

export default api;
