const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../serviceAccountKey.json');
    
    // Replace newlines in private key
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw new Error('Failed to initialize Firebase Admin');
  }
}

module.exports = admin; 