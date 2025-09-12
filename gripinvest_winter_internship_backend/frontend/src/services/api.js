import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  signup: (userData) => apiClient.post('/auth/signup', userData),
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (profileData) => apiClient.put('/auth/profile', profileData),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, otp, newPassword) => 
    apiClient.post('/auth/reset-password', { token, otp, newPassword }),
  changePassword: (currentPassword, newPassword) => 
    apiClient.post('/auth/change-password', { currentPassword, newPassword }),
  verifyEmail: (token) => apiClient.post('/auth/verify-email', { token }),
  refreshToken: () => apiClient.post('/auth/refresh-token'),
  analyzePassword: (password, userContext) => 
    apiClient.post('/auth/analyze-password', { password, userContext }),
  getSecurityRecommendations: () => apiClient.get('/auth/security-recommendations'),
  getRiskAnalysis: () => apiClient.get('/auth/risk-analysis'),
  getSessions: () => apiClient.get('/auth/sessions'),
  revokeSession: (sessionId) => apiClient.delete(`/auth/sessions/${sessionId}`),
};

// Products API
export const productsAPI = {
  getProducts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/products${queryString ? `?${queryString}` : ''}`);
  },
  getProductById: (id) => apiClient.get(`/products/${id}`),
  getCategories: () => apiClient.get('/products/categories'),
  getTrending: () => apiClient.get('/products/trending'),
  simulateInvestment: (productId, amount, tenure) => 
    apiClient.post(`/products/${productId}/simulate`, { amount, tenure }),
  compareProducts: (productIds) => 
    apiClient.post('/products/compare', { productIds }),
};

// Investment API
export const investmentAPI = {
  createInvestment: (investmentData) => apiClient.post('/investments', investmentData),
  getPortfolio: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/investments/portfolio${queryString ? `?${queryString}` : ''}`);
  },
  getInvestment: (id) => apiClient.get(`/investments/${id}`),
  updateInvestment: (id, updateData) => apiClient.put(`/investments/${id}`, updateData),
  cancelInvestment: (id) => apiClient.delete(`/investments/${id}`),
  getPortfolioInsights: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/investments/insights${queryString ? `?${queryString}` : ''}`);
  },
};

// Logs API
export const logsAPI = {
  getLogs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/logs${queryString ? `?${queryString}` : ''}`);
  },
};

// Utility functions
export const uploadFile = async (file, endpoint) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response;
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};

export const downloadFile = async (url, filename) => {
  try {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });
    
    const downloadUrl = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('File download failed:', error);
    toast.error('Download failed. Please try again.');
  }
};

// Health check
export const healthCheck = () => apiClient.get('/health');

export default apiClient;