import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`Token: ${token.substring(0, 20)}...`);
    } else {
      console.warn(`API Request without token: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    };
    
    console.error('API Response Error:', errorDetails);

    if (error.response?.status === 401 || error.response?.status === 403) {
      const currentPath = window.location.pathname;
      
      // Don't auto-redirect for certain endpoints - let components handle them
      const protectedEndpoints = [
        '/payments/my-payments',
        '/reviews/',
        '/rides/my-rides'
      ];
      
      const shouldComponentHandle = protectedEndpoints.some(endpoint => 
        error.config?.url?.includes(endpoint)
      );
      
      if (shouldComponentHandle) {
        console.warn('Authentication failed for protected resource - component will handle this');
        console.warn('Endpoint:', error.config?.url);
        return Promise.reject(error);
      }
      
      // For other endpoints, clear session and redirect
      console.error('Authentication failed - clearing session and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (currentPath !== '/' && currentPath !== '/login') {
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
