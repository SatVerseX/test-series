const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    console.log('Initializing Firebase Admin...');
    
    // Check if service account file exists
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Service account file not found at ${serviceAccountPath}`);
    }

    // Load and validate service account
    const serviceAccount = require('../serviceAccountKey.json');
    
    // Validate required fields
    const requiredFields = ['project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !serviceAccount[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in service account: ${missingFields.join(', ')}`);
    }
    
    // Replace newlines in private key if it's a string
    if (typeof serviceAccount.private_key === 'string') {
      console.log('Processing private key...');
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    
    // Log service account details (without sensitive info)
    console.log('Service account details:', {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKeyPresent: !!serviceAccount.private_key
    });
    
    // Initialize the app
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    // Verify initialization
    if (!app.name) {
      throw new Error('Firebase Admin initialization failed: app.name is undefined');
    }

    console.log('Firebase Admin initialized successfully:', {
      appName: app.name,
      projectId: app.options.projectId
    });

    // Test token verification
    console.log('Testing token verification capability...');
    const auth = app.auth();
    if (!auth) {
      throw new Error('Firebase Auth not initialized properly');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    if (error.message.includes('service account')) {
      console.error('Service account error. Please check your serviceAccountKey.json file.');
    } else if (error.code === 'app/invalid-credential') {
      console.error('Invalid credential. Please check your service account private key.');
    }

    throw new Error(`Failed to initialize Firebase Admin: ${error.message}`);
  }
}

module.exports = admin; 