// vercel.config.js
module.exports = {
  // This function runs before your application starts on Vercel
  onVercelInit: ({ env }) => {
    // Set environment variables when deploying to Vercel
    env.FRONTEND_URL = 'https://frontend-14fqfcvk7-satish-pals-projects.vercel.app';
    
    // Enable additional CORS headers
    env.ENABLE_CORS = 'true';
  }
}; 