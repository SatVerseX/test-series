import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import axios from 'axios';

/**
 * Register a new user with email and password
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @param {string} userData.name - User's full name
 * @param {string} userData.phoneNumber - User's phone number
 * @param {string} userData.grade - User's grade (for students)
 * @returns {Promise<Object>} - User data from backend
 */
export const registerWithEmail = async (userData) => {
  try {
    // Step 1: Create user in Firebase
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    // Step 2: Update Firebase profile
    await updateProfile(userCredential.user, {
      displayName: userData.name,
      photoURL: userCredential.user.photoURL || null
    });
    
    // Step 3: Register in our backend without token verification
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/users/register`,
      {
        firebaseId: userCredential.user.uid,
        email: userData.email,
        name: userData.name,
        phoneNumber: userData.phoneNumber,
        grade: userData.grade,
        subjects: [],
        photoURL: userCredential.user.photoURL || null,
        role: 'student' // Default role
      }
    );
    
    return {
      firebaseUser: userCredential.user,
      backendUser: response.data
    };
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific error cases
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please try logging in instead.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address. Please check and try again.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use a stronger password.');
    } else if (error.response?.status === 409) {
      throw new Error('Email already registered. Please login instead.');
    } else {
      throw new Error(error.response?.data?.error || 'Registration failed. Please try again.');
    }
  }
}; 