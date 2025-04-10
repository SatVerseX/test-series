import axios from 'axios';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create API instance with retry and timeout
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  retry: 3,
  retryDelay: 1000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add retry interceptor
api.interceptors.response.use(null, async (error) => {
  const { config, response } = error;
  if (!config || !config.retry) {
    return Promise.reject(error);
  }
  
  config.retry -= 1;
  const delayRetry = new Promise(resolve => {
    setTimeout(resolve, config.retryDelay || 1000);
  });
  
  await delayRetry;
  return api(config);
});

// Add auth interceptor
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn('No user logged in');
      return config;
    }

    try {
      // Force token refresh and get a new token
      const token = await user.getIdToken(true);
      console.log('Token refreshed successfully, length:', token ? token.length : 0);
      
      if (token) {
        // Make sure the Authorization header is set correctly
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Authorization header set:', config.headers.Authorization.substring(0, 20) + '...');
      } else {
        console.error('Token is null or undefined after refresh');
      }
    } catch (tokenError) {
      console.error('Error getting auth token:', tokenError);
      // Don't automatically redirect, let the component handle it
      if (tokenError.code === 'auth/invalid-user-token') {
        console.warn('Invalid token detected, but not redirecting automatically');
      }
    }
    return config;
  } catch (error) {
    console.error('Error in auth interceptor:', error);
    return config;
  }
});

// Add response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized request detected');
      console.log('Request URL:', error.config?.url);
      console.log('Request headers:', error.config?.headers);
      
      // Try to refresh the token and retry the request
      try {
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken(true);
          if (token && error.config) {
            // Update the Authorization header
            error.config.headers.Authorization = `Bearer ${token}`;
            console.log('Retrying request with new token');
            return api(error.config);
          }
        }
      } catch (refreshError) {
        console.error('Error refreshing token in response interceptor:', refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export { api }; 