// src/api.js
import axios from 'axios';

// Use proxy mode (vite.config.js proxies /dashcam and /fleet to backend)
const api = axios.create({
  baseURL: '/', // same origin; Vite proxy will forward API routes
  timeout: 60000,
});

export const dashcamAPI = {
  getStatus: async () => (await api.get('/dashcam/status')).data,

  analyzeImage: async (imageFile, gpsData = {}) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    Object.entries(gpsData).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, v);
    });
    const res = await api.post('/dashcam/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getFleetVehicles: async () => {
    try {
      const res = await api.get('/fleet/vehicles');
      return res.data.vehicles || [];
    } catch {
      return [];
    }
  },
};