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
import api from '../config/api';

// Create API instance with retry and timeout
export const apiInstance = api;

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

  const handleError = useCallback((error, context) => {
    console.error(`${context} error:`, error);
    

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

  const getValidToken = useCallback(async (user) => {
    try {
      const token = await user.getIdToken();
      const decodedToken = await user.getIdTokenResult();
      
      
      if (decodedToken.expirationTime < Date.now() + 5 * 60 * 1000) {
        try {
          return await user.getIdToken(true);
        } catch (refreshError) {
       
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

  const registerUser = async (userData) => {
    try {
     
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const token = await userCredential.user.getIdToken();

   
      const response = await apiInstance.post(
        '/api/users/register',
        {
          firebaseId: userCredential.user.uid,
          email: userData.email,
          name: userData.name,
          phoneNumber: userData.phoneNumber,
          role: userData.role || 'student',
          grade: userData.grade || '10th' 
        }
      );

      await updateProfile(userCredential.user, {
        displayName: userData.name,
        photoURL: userData.photoURL || null
      });

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

 
  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'No user');
      if (firebaseUser) {
        try {
          console.log('Firebase user found:', firebaseUser.uid, firebaseUser.email);
          const token = await firebaseUser.getIdToken();
          console.log('Token obtained:', token ? 'Success' : 'Failed');
          
          try {
            console.log('Fetching user from backend:', `${import.meta.env.VITE_API_URL}/api/users/${firebaseUser.uid}`);
            const response = await apiInstance.get(`/api/users/${firebaseUser.uid}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log('User data from backend:', response.data);
            setUser(response.data);
            // Store in localStorage for persistence
            localStorage.setItem('user', JSON.stringify(response.data));
          } catch (error) {
            console.error('Backend API error:', error.response?.status, error.message);
            if (error.response?.status === 404) {
              
              try {
                const token = await firebaseUser.getIdToken();
                const registerResponse = await apiInstance.post('/api/users/register', {
                  firebaseId: firebaseUser.uid,
                  email: firebaseUser.email,
                  name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                  photoURL: firebaseUser.photoURL,
                  role: 'student', 
                  grade: '10' 
                });
                setUser(registerResponse.data);
              } catch (registerError) {
                console.error('Error registering user:', registerError);
                setUser(null);
              }
            } else {
              console.error('Error fetching user:', error);
              // Try to load from localStorage as fallback
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                console.log('Using stored user data as fallback');
                setUser(JSON.parse(storedUser));
              } else {
                setUser(null);
              }
            }
          }
        } catch (error) {
          console.error('Token fetch error:', error);
          setUser(null);
        }
      } else {
        console.log('No Firebase user, clearing state');
        localStorage.removeItem('user');
        setUser(null);
      }
      setLoading(false);
    });

    // Check for stored user on initial load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      console.log('Found stored user on init');
      setUser(JSON.parse(storedUser));
    }

    return () => unsubscribe();
  }, []);

 
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
         
          if (err.code !== 'auth/network-request-failed') {
            console.error('Error refreshing token:', err);
          }
        }
      }, 10 * 60 * 1000); 

      return () => clearInterval(interval);
    }
  }, [user]);

  
  const signInWithGoogle = async () => {
    try {
     
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

  
  const register = async (userData) => {
    try {
      const user = await registerUser(userData);
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

 
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setError(null);
    } catch (error) {
      throw handleError(error, 'Logout');
    }
  };

  
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      setError(null);
    } catch (error) {
      throw handleError(error, 'Password reset');
    }
  };

  
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    signInWithGoogle,
    api 
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;