import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Axios interceptor to attach auth token
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken(true);
      config.headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error('Token refresh error:', error);
    }
  }
  return config;
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          
          // Try to get user profile from backend
          try {
            const response = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/users/${firebaseUser.uid}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );
            setUser({ ...firebaseUser, ...response.data });
          } catch (error) {
            if (error.response?.status === 404) {
              // User exists in Firebase but not in our backend
              // Register them in our backend
              try {
                const registerResponse = await axios.post(
                  `${import.meta.env.VITE_API_URL}/api/users/auth/google`,
                  {
                    idToken: token,
                    name: firebaseUser.displayName || '',
                    email: firebaseUser.email,
                    phoneNumber: '',
                    grade: '10th',
                    subjects: []
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`
                    }
                  }
                );
                setUser({ ...firebaseUser, ...registerResponse.data });
              } catch (registerError) {
                console.error('Error registering user in backend:', registerError);
                setUser(firebaseUser);
              }
            } else {
              console.error('Error fetching user profile:', error);
              setUser(firebaseUser);
            }
          }
        } catch (error) {
          console.error('Error getting token:', error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email, password, name) => {
    try {
      // Register with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with name
      await userCredential.user.updateProfile({
        displayName: name
      });

      // Get the token
      const token = await userCredential.user.getIdToken();

      // Register with backend
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/auth/google`,
        {
          idToken: token,
          name: name,
          email: email,
          phoneNumber: '',
          grade: '10th',
          subjects: []
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return userCredential;
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please try logging in instead.');
      }
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      // Get user profile from backend
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users/${userCredential.user.uid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUser({ ...userCredential.user, ...response.data });
      return userCredential;
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      }
      throw error;
    }
  };

  const googleSignIn = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const token = await userCredential.user.getIdToken();

      // Get or create user profile in backend
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/users/${userCredential.user.uid}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setUser({ ...userCredential.user, ...response.data });
      } catch (error) {
        if (error.response?.status === 404) {
          // Register user in backend
          const registerResponse = await axios.post(
            `${import.meta.env.VITE_API_URL}/api/users/auth/google`,
            {
              idToken: token,
              name: userCredential.user.displayName || '',
              email: userCredential.user.email,
              phoneNumber: '',
              grade: '10th',
              subjects: []
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          setUser({ ...userCredential.user, ...registerResponse.data });
        } else {
          throw error;
        }
      }

      return userCredential;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    register,
    login,
    logout,
    googleSignIn
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}