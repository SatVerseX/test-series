const admin = require('../config/firebase-admin');
const User = require('../models/User');

// Verify Firebase token
const verifyToken = async (req, res, next) => {
  try {
    console.log('=== Starting Token Verification ===');
    console.log('Request path:', req.path);
    console.log('Request headers:', {
      authorization: req.headers.authorization ? 'present' : 'missing',
      contentType: req.headers['content-type']
    });

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('Authorization header missing');
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('Token missing in authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('Token found, verifying with Firebase Admin...');
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
      console.log('Token verified successfully:', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified
      });
    } catch (tokenError) {
      console.error('Token verification failed:', {
        name: tokenError.name,
        message: tokenError.message,
        code: tokenError.code,
        stack: tokenError.stack
      });
      
      // Specific error handling based on Firebase error codes
      if (tokenError.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: 'Token expired' });
      }
      if (tokenError.code === 'auth/id-token-revoked') {
        return res.status(401).json({ error: 'Token revoked' });
      }
      if (tokenError.code === 'auth/argument-error') {
        return res.status(401).json({ error: 'Invalid token format' });
      }
      
      return res.status(401).json({ error: 'Invalid token', details: tokenError.message });
    }

    try {
      console.log('Looking up user in database with firebaseId:', decodedToken.uid);
      const user = await User.findOne({ firebaseId: decodedToken.uid });
      if (!user) {
        console.log('User not found in database for firebaseId:', decodedToken.uid);
        return res.status(404).json({ error: 'User not found' });
      }
      console.log('User found in database:', {
        id: user._id,
        firebaseId: user.firebaseId,
        role: user.role
      });
      req.user = user;
      
      // Always set req.dbUser to ensure it's available in routes
      req.dbUser = user;
      
      next();
    } catch (dbError) {
      console.error('Database error during user lookup:', {
        name: dbError.name,
        message: dbError.message,
        code: dbError.code,
        stack: dbError.stack,
        uid: decodedToken?.uid
      });
      return res.status(500).json({ error: 'Database error during authentication', details: dbError.message });
    }
  } catch (error) {
    console.error('=== Token Verification Failed ===');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Token revoked' });
    }
    if (error.code === 'auth/id-token-invalid') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
};

// Check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    console.log('=== Checking Admin Status ===');
    console.log('User role:', req.user.role);
    
    if (req.user.role !== 'admin') {
      console.log('Access denied: User is not an admin');
      return res.status(403).json({ error: 'Access denied: Admin privileges required' });
    }
    
    console.log('Admin access granted');
    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ error: 'Error checking admin status' });
  }
};

// Middleware to check if user has specific permission
const hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      // User should already be authenticated by verifyToken middleware
      if (!req.user || !req.user.firebaseId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Find user in database to check permissions
      const user = await User.findOne({ firebaseId: req.user.firebaseId });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!user.hasAdminPermission(permission)) {
        return res.status(403).json({ 
          error: `Access denied. ${permission} permission required.` 
        });
      }

      // Add user object to request for further use
      req.dbUser = user;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Error checking permissions' });
    }
  };
};

// Middleware to check if user is a teacher
const isTeacher = async (req, res, next) => {
  try {
    // User should already be authenticated by verifyToken middleware
    if (!req.user || !req.user.firebaseId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Find user in database to check role
    const user = await User.findOne({ firebaseId: req.user.firebaseId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Allow access if user is admin or teacher
    if (user.role === 'admin' || user.isTeacher()) {
      // Add user object to request for further use
      req.dbUser = user;
      return next();
    }

    return res.status(403).json({ error: 'Access denied. Teacher privileges required.' });
  } catch (error) {
    console.error('Teacher check error:', error);
    return res.status(500).json({ error: 'Error checking teacher privileges' });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  hasPermission,
  isTeacher
}; 