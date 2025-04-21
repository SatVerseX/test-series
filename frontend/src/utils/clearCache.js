/**
 * Utility to clear test-related caches from localStorage and sessionStorage
 * This helps ensure fresh data is loaded in case of stale caches.
 * 
 * @param {string} testId - Optional testId to clear cache for a specific test
 */
export const clearTestCache = (testId) => {
  console.log('Clearing test cache', testId ? `for test ${testId}` : 'for all tests');
  
  // Clear localStorage
  if (window.localStorage) {
    Object.keys(window.localStorage).forEach(key => {
      if (key.includes('test') || 
          key.includes('question') || 
          key.includes('attempt') || 
          key.includes('progress')) {
        
        // If testId provided, only clear cache for that test
        if (testId && !key.includes(testId)) {
          return;
        }
        
        window.localStorage.removeItem(key);
        console.log('Cleared localStorage item:', key);
      }
    });
  }

  // Clear sessionStorage
  if (window.sessionStorage) {
    Object.keys(window.sessionStorage).forEach(key => {
      if (key.includes('test') || 
          key.includes('question') || 
          key.includes('attempt') || 
          key.includes('progress')) {
        
        // If testId provided, only clear cache for that test
        if (testId && !key.includes(testId)) {
          return;
        }
        
        window.sessionStorage.removeItem(key);
        console.log('Cleared sessionStorage item:', key);
      }
    });
  }
};

/**
 * Add cache-busting headers to a request config object for Axios
 * 
 * @param {Object} config - Optional axios config object
 * @returns {Object} Axios config with cache-busting headers
 */
export const addCacheBusting = (config = {}) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'If-Modified-Since': new Date(0).toUTCString()
    }
  };
};

export default {
  clearTestCache,
  addCacheBusting
}; 