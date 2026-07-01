import axios from 'axios';

// Use relative URL in dev (goes through Vite proxy), full URL in production
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stratag_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Health check
export const healthCheck = () => api.get('/health');

// Radio Calls
export const getRadioCalls = (params?: any) => api.get('/radio-calls', { params });
export const createRadioCall = (data: any) => api.post('/radio-calls', data);
export const transcribeAudio = (audioBase64: string, mimeType = 'audio/wav') => 
  api.post('/transcription/audio', { audioBase64, mimeType });

// Incidents
export const getIncidents = (params?: any) => api.get('/incidents', { params });
export const getIncident = (id: string) => api.get(`/incidents/${id}`);
export const createIncident = (data: any) => api.post('/incidents', data);
export const updateIncidentStatus = (id: string, status: string, notes?: string) => 
  api.patch(`/incidents/${id}/status`, { status, notes });
export const dispatchIncident = (id: string, driver_id: string) => 
  api.post(`/incidents/${id}/dispatch`, { driver_id });

// Drivers
export const getDrivers = () => api.get('/drivers');
export const getDriver = (id: string) => api.get(`/drivers/${id}`);
export const createDriver = (data: any) => api.post('/drivers', data);
export const updateDriverStatus = (id: string, data: any) => api.patch(`/drivers/${id}/status`, data);
export const deleteDriver = (id: string) => api.delete(`/drivers/${id}`);

// Vonage
export const sendSms = (to: string, text: string) => api.post('/vonage/sms', { to, text });
export const sendWhatsApp = (to: string, text: string) => api.post('/vonage/whatsapp', { to, text });

// Analytics
export const getDashboardStats = () => api.get('/analytics/dashboard');
export const getPerformance = (days = 7) => api.get('/analytics/performance', { params: { days } });

// Auth
export const login = (email: string, password: string) => api.post('/auth/login', { email, password });

export default api;
