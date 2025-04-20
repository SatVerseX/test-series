import axios from "axios";
import { auth } from "./firebase";

const API_URL =
  import.meta.env.VITE_API_URL || "https://backend-satish-pals-projects.vercel.app";

// Create a custom timeout promise that will reject after a set time
const ABSOLUTE_TIMEOUT = 90000; // 90 seconds absolute maximum time for any request

// Create API instance with reasonable defaults
const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 second timeout
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
});

// Create a function to add absolute timeout to any request
const withAbsoluteTimeout = (promise, timeoutMs = ABSOLUTE_TIMEOUT) => {
  let timeoutId;
  
  // Create a promise that rejects after timeout
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Request exceeded absolute maximum timeout'));
    }, timeoutMs);
  });
  
  // Race between the original promise and the timeout
  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => clearTimeout(timeoutId));
};

// Add request interceptor to attach auth token to all requests
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log requests in development
      if (import.meta.env.DEV) {
        console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
      }
      
      return config;
    } catch (error) {
      console.error('Error preparing request:', error);
      return config;
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.status, error.config?.url);
    
    // Handle network errors/timeouts
    if (!error.response) {
      console.error('Network error or timeout:', error.message);
      
      // Check if it's a timeout error
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        // Get the original request config
        const originalRequest = error.config;
        
        // If retry attempt count is not set, initialize it
        if (!originalRequest._retryCount) {
          originalRequest._retryCount = 0;
        }
        
        // Limit to 2 retry attempts for timeouts
        if (originalRequest._retryCount < 2) {
          originalRequest._retryCount++;
          
          // Log retry attempt
          console.log(`Retrying request (${originalRequest._retryCount}/2) after timeout: ${originalRequest.url}`);
          
          // Delay before retry
          const delay = 1000;
          
          // Return a promise that resolves after the delay and retries the request
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(api(originalRequest));
            }, delay);
          });
        }
        
        // If we've reached max retries, reject with clear message
        return Promise.reject(new Error('Request failed after multiple attempts due to timeout'));
      }
    }
    
    // Check for token expiration
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        const user = auth.currentUser;
        if (user) {
          await user.getIdToken(true);
          // Retry original request with new token
          const originalRequest = error.config;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    
    // Handle 504 Outdated Request errors with retry logic
    if (error.response?.status === 504) {
      // Get the original request config
      const originalRequest = error.config;
      
      // If retry attempt count is not set, initialize it
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }
      
      // Limit to 2 retry attempts (reduced from 3)
      if (originalRequest._retryCount < 2) {
        originalRequest._retryCount++;
        
        // Log retry attempt
        console.log(`Retrying request (${originalRequest._retryCount}/2) after 504 error: ${originalRequest.url}`);
        
        // Add exponential backoff delay based on retry count
        const delay = 1000 * Math.pow(2, originalRequest._retryCount - 1);
        
        // Return a promise that resolves after the delay and retries the request
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(api(originalRequest));
          }, delay);
        });
      }
      
      // If we've reached max retries, reject with clear message
      return Promise.reject(new Error('Server unavailable after multiple attempts (504 error)'));
    }
    
    return Promise.reject(error);
  }
);

// Override the get, post, put, delete methods to add absolute timeout protection
const originalGet = api.get;
api.get = function(url, config) {
  return withAbsoluteTimeout(originalGet.call(this, url, config));
};

const originalPost = api.post;
api.post = function(url, data, config) {
  return withAbsoluteTimeout(originalPost.call(this, url, data, config));
};

const originalPut = api.put;
api.put = function(url, data, config) {
  return withAbsoluteTimeout(originalPut.call(this, url, data, config));
};

const originalDelete = api.delete;
api.delete = function(url, config) {
  return withAbsoluteTimeout(originalDelete.call(this, url, config));
};

// Specialized function for handling download link requests
api.getDownloadLinks = async (book) => {
  try {
    // Validate book object before sending
    if (!book) {
      console.error('Invalid book object:', book);
      throw new Error('Invalid book data for download');
    }
    
    // Function to convert and properly encode LibGen download links
    function convertToEncodedLink(rawLink) {
      const parts = rawLink.split('/');
      const base = parts.slice(0, 5).join('/'); // e.g., https://download.books.ms/main/0/hash
      const hash = parts[5].toLowerCase(); // convert hash to lowercase
      const filename = parts.slice(6).join('/'); // filename part
      const encodedFilename = encodeURIComponent(filename).replace(/%2F/g, '/'); // encode but preserve slashes
      return `${parts[0]}//${parts[2]}/main/0/${hash}/${encodedFilename}`;
    }
    
    // Helper function to convert to direct download link
    const toDirectLink = (url, mirrorType) => {
      if (!url) return null;
      
      // Get book ID (MD5) - this is the most important part
      let bookId = '';
      
      // Try to extract from URL
      if (url.includes('md5=')) {
        bookId = url.split('md5=')[1].split('&')[0];
      } else if (url.includes('ipfs/')) {
        bookId = url.split('ipfs/')[1].split('?')[0];
      }
      
      // If not found in URL, try from book object
      if (!bookId && (book.md5 || book.MD5)) {
        bookId = book.md5 || book.MD5;
      }
      
      // If we have a book ID, always create direct download URL
      if (bookId) {
        // Standardize book ID format - must be exactly 32 characters
        if (bookId.length > 32) {
          bookId = bookId.substring(0, 32);
        } else if (bookId.length < 32) {
          // Pad with zeros if shorter (unlikely but just in case)
          bookId = bookId.padEnd(32, '0');
        }
        
        // Create filename in the exact format provided:
        // (Information science and statistics) Author - Title-Publisher (Year).pdf
        let filename = '';
        const title = book.Title || 'Unknown';
        const author = book.Author || 'Unknown';
        const publisher = book.Publisher || 'Publisher';
        const year = book.Year || 'Year';
        const extension = book.Extension ? book.Extension.toLowerCase() : 'pdf';
        
        // Use exact format with category prefix
        filename = `(Information science and statistics) ${author} - ${title}-${publisher} (${year}).${extension}`;
        
        // Create raw link first
        const rawLink = `https://download.books.ms/main/0/${bookId}/${filename}`;
        
        // Use the provided function to properly encode the link
        return convertToEncodedLink(rawLink);
      }
      
      // If it's already a download.books.ms link, make sure it's properly encoded
      if (url.includes('download.books.ms')) {
        return convertToEncodedLink(url);
      }
      
      // Fallback: return original URL
      return url;
    };
    
    // If the book has Mirror_2 link, use ONLY that one
    if (book.Mirror_2) {
      console.log('Using only Mirror_2 link as requested');
      return [{
        url: toDirectLink(book.Mirror_2, 'Mirror_2'),
        source: 'GET'
      }];
    }
    
    // Fallback to API call if mirror links aren't available
    // Use longer timeout for download link requests
    const response = await api.post('/resolve', book, {
      timeout: 40000 // 40 second timeout
    });
    
    if (!response.data || !response.data.success) {
      console.error('API response was not successful:', response.data);
      throw new Error(response.data?.message || 'Failed to retrieve download links');
    }
    
    // Handle different response formats
    let links = response.data.data;
    
    // If it's an array of objects, look for Mirror_2/GET links
    if (Array.isArray(links)) {
      console.log('Received array of links, looking for Mirror_2/GET:', links);
      
      // First try to find a Mirror_2/GET link
      const getLink = links.find(link => 
        link.source === 'GET' || 
        link.source === 'Mirror 2' || 
        link.source === 'Mirror_2'
      );
      
      if (getLink) {
        return [{
          url: toDirectLink(getLink.url, 'Mirror_2'),
          source: 'GET'
        }];
      }
      
      // If no explicit GET link found but we have any link, convert the first one
      if (links.length > 0) {
        return [{
          url: toDirectLink(links[0].url, 'Mirror_2'),
          source: 'GET'
        }];
      }
    }
    
    // If it's an object with URL keys
    if (typeof links === 'object' && !Array.isArray(links)) {
      console.log('Received object with links, looking for Mirror_2/GET:', links);
      
      // First try to find Mirror_2 or GET key
      let url = links['Mirror_2'] || links['Mirror 2'] || links['GET'] || links['get'];
      
      // If found, return it
      if (url && typeof url === 'string') {
        return [{
          url: toDirectLink(url, 'Mirror_2'),
          source: 'GET'
        }];
      }
      
      // Otherwise, just use the first available link
      for (const [source, linkUrl] of Object.entries(links)) {
        if (linkUrl && typeof linkUrl === 'string' && 
            (linkUrl.startsWith('http://') || linkUrl.startsWith('https://'))) {
          return [{
            url: toDirectLink(linkUrl, 'Mirror_2'),
            source: 'GET'
          }];
        }
      }
    }
    
    throw new Error('No valid download links found');
  } catch (err) {
    // Provide more detailed error logging
    console.error('Error getting download links:', err);
    console.error('Error details:', {
      message: err.message,
      response: err.response ? {
        status: err.response.status,
        data: err.response.data
      } : 'No response',
      request: err.request ? 'Request was made but no response received' : 'No request'
    });
    
    // Throw a user-friendly error
    throw new Error(err.response?.data?.message || err.message || 'Could not retrieve download links');
  }
};

export default api;
