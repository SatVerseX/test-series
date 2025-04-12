import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import axios from 'axios';

/**

 * @param {Object} userData 
 * @param {string} userData.email 
 * @param {string} userData.password 
 * @param {string} userData.name 
 * @param {string} userData.phoneNumber 
 * @param {string} userData.grade 
 * @returns {Promise<Object>} 
 */
export const registerWithEmail = async (userData) => {
  try {
    
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );
    
    
    await updateProfile(userCredential.user, {
      displayName: userData.name,
      photoURL: userCredential.user.photoURL || null
    });
    
   
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
        role: 'student' 
      }
    );
    
    return {
      firebaseUser: userCredential.user,
      backendUser: response.data
    };
  } catch (error) {
    console.error('Registration error:', error);
    
   
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