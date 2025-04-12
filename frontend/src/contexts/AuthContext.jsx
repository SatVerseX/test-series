import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  getRedirectResult,
  sendPasswordResetEmail,
  signInWithRedirect,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import axios from 'axios';
import { api } from '../config/api';

// Create API instance with retry and timeout
export const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  retry: 3,
  retryDelay: 1000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add retry interceptor
apiInstance.interceptors.response.use(null, async (error) => {
  const { config, response } = error;
  if (!config || !config.retry) {
    return Promise.reject(error);
  }
  
  config.retry -= 1;
  const delayRetry = new Promise(resolve => {
    setTimeout(resolve, config.retryDelay || 1000);
  });
  
  await delayRetry;
  return apiInstance(config);
});

// Add auth interceptor
apiInstance.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Error handling utility
  const handleError = useCallback((error, context) => {
    console.error(`${context} error:`, error);
    
    // Handle network errors specifically
    if (error.code === 'auth/network-request-failed' || error.message?.includes('network')) {
      setError({
        message: 'Network connection error. Please check your internet connection and try again.',
        code: 'NETWORK_ERROR',
        context
      });
    } else {
      setError({
        message: error.message,
        code: error.code,
        context
      });
    }
    
    setUser(null);
    return error;
  }, []);

  // Token management with better error handling
  const getValidToken = useCallback(async (user) => {
    try {
      const token = await user.getIdToken();
      const decodedToken = await user.getIdTokenResult();
      
      // Check if token is about to expire (within 5 minutes)
      if (decodedToken.expirationTime < Date.now() + 5 * 60 * 1000) {
        try {
          return await user.getIdToken(true);
        } catch (refreshError) {
          // If token refresh fails, try to use the existing token
          if (refreshError.code === 'auth/network-request-failed') {
            console.warn('Token refresh failed due to network error, using existing token');
            return token;
          }
          throw refreshError;
        }
      }
      return token;
    } catch (error) {
      throw handleError(error, 'Token refresh');
    }
  }, [handleError]);

  // User registration with enhanced features
  const registerUser = async (userData) => {
    try {
      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Get the ID token
      const token = await userCredential.user.getIdToken();

      // Register user in backend - no token required for initial registration
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/register`,
        {
          firebaseId: userCredential.user.uid,
          email: userData.email,
          name: userData.name,
          phoneNumber: userData.phoneNumber,
          role: userData.role || 'student',
          grade: userData.grade || '10th' // Default grade for students
        }
      );

      // Update user profile with additional info
      await updateProfile(userCredential.user, {
        displayName: userData.name,
        photoURL: userData.photoURL || null
      });

      // Set the user state with both Firebase and backend data
      setUser({
        ...userCredential.user,
        ...response.data,
        accessToken: token
      });

      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Auth state listener with better error handling
  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const response = await apiInstance.get(`/api/users/${firebaseUser.uid}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
        } catch (error) {
          if (error.response?.status === 404) {
            // User not found in database, register them
            try {
              const token = await firebaseUser.getIdToken();
              const registerResponse = await apiInstance.post('/api/users/register', {
                firebaseId: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                photoURL: firebaseUser.photoURL,
                role: 'student', // Default role
                grade: '10' // Default grade for students
              });
              setUser(registerResponse.data);
            } catch (registerError) {
              console.error('Error registering user:', registerError);
              setUser(null);
            }
          } else {
            console.error('Error fetching user:', error);
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Refresh token periodically with better error handling
  useEffect(() => {
    if (user) {
      const interval = setInterval(async () => {
        try {
          const token = await auth.currentUser?.getIdToken(true);
          if (token) {
            setUser(prev => ({
              ...prev,
              accessToken: token
            }));
          }
        } catch (err) {
          // Don't log network errors during token refresh
          if (err.code !== 'auth/network-request-failed') {
            console.error('Error refreshing token:', err);
          }
        }
      }, 10 * 60 * 1000); // Refresh every 10 minutes

      return () => clearInterval(interval);
    }
  }, [user]);

  // Google Sign-In
  const signInWithGoogle = async () => {
    try {
      // Try popup first
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const { user: firebaseUser } = result;
        const token = await getValidToken(firebaseUser);
        
        try {
          const response = await apiInstance.get(`/api/users/${firebaseUser.uid}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setUser({ ...response.data, token });
          setError(null);
        } catch (error) {
          if (error.response?.status === 404) {
            await registerUser(firebaseUser);
          } else {
            throw handleError(error, 'Google sign-in');
          }
        }
      } catch (popupError) {
        // If popup is blocked, fallback to redirect
        if (popupError.code === 'auth/popup-blocked') {
          console.log('Popup blocked, falling back to redirect');
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        throw popupError;
      }
    } catch (error) {
      throw handleError(error, 'Google sign-in');
    }
  };

  // Check redirect result
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const { user: firebaseUser } = result;
          const token = await getValidToken(firebaseUser);
          
          try {
            const response = await apiInstance.get(`/api/users/${firebaseUser.uid}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            setUser({ ...response.data, token });
            setError(null);
          } catch (error) {
            if (error.response?.status === 404) {
              await registerUser(firebaseUser);
            } else {
              throw handleError(error, 'Google sign-in redirect');
            }
          }
        }
      } catch (error) {
        handleError(error, 'Redirect result check');
      }
    };

    checkRedirectResult();
  }, [getValidToken, handleError, registerUser]);

  // Email/Password Login
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const { user: firebaseUser } = result;
      const token = await getValidToken(firebaseUser);
      
      const response = await apiInstance.get(`/api/users/${firebaseUser.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser({ ...response.data, token });
      setError(null);
    } catch (error) {
      throw handleError(error, 'Login');
    }
  };

  // Registration
  const register = async (userData) => {
    try {
      const user = await registerUser(userData);
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setError(null);
    } catch (error) {
      throw handleError(error, 'Logout');
    }
  };

  // Password Reset
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      setError(null);
    } catch (error) {
      throw handleError(error, 'Password reset');
    }
  };

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Return the context value with api included
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    signInWithGoogle,
    api // Include the api instance in the context
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;