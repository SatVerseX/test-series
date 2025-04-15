import axios from "axios";
import { auth } from "./firebase";

const API_URL =
  import.meta.env.VITE_API_URL || "https://backend-satish-pals-projects.vercel.app";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
});

// Add request interceptor to attach auth token to all requests
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log requests in development
      if (import.meta.env.DEV) {
        console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
      }
      
      return config;
    } catch (error) {
      console.error('Error preparing request:', error);
      return config;
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.status, error.config?.url);
    
    // Check for token expiration
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        const user = auth.currentUser;
        if (user) {
          await user.getIdToken(true);
          // Retry original request with new token
          const originalRequest = error.config;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
