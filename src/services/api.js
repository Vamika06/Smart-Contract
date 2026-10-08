import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  updatePreferences: (data) => api.put('/auth/preferences', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const contractAPI = {
  scan: (data) => {
    if (data instanceof FormData) {
      return api.post('/contracts/scan', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post('/contracts/scan', data);
  },
  getStatus: (id) => api.get(`/contracts/${id}/status`),
  getHistory: (params) => api.get('/contracts/history', { params }),
  getById: (id) => api.get(`/contracts/${id}`),
  delete: (id) => api.delete(`/contracts/${id}`),
  updateNotes: (id, data) => api.patch(`/contracts/${id}/notes`, data),
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export const reportAPI = {
  downloadPDF: (id) => api.get(`/reports/${id}/pdf`, { responseType: 'blob' }),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (id) => api.patch(`/admin/users/${id}/toggle-status`),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  getScans: (params) => api.get('/admin/scans', { params }),
  getLogs: (params) => api.get('/admin/logs', { params }),
};

export default api;
