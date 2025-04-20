// API configuration
const config = {
  
  // Production API URL (replace with your Render.com URL when deployed)
  // Example: 'https://libgen-api.onrender.com'
  PRODUCTION_API_URL: 'https://library-backend-2d9k.onrender.com',
  
  // Use this function to get the current API URL based on environment
  getApiUrl: function() {
    // In production, we always want to use the PRODUCTION_API_URL
    if (import.meta.env.PROD) {
      return this.PRODUCTION_API_URL;
    }
    
    // If production URL is set, use it, otherwise fallback to proxy setup in package.json
    if (this.PRODUCTION_API_URL) {
      return this.PRODUCTION_API_URL;
    }
    return ''; // Empty string will use the proxy in package.json
  }
};

export default config; 