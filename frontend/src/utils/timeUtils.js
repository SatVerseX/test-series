/**
 * Utility functions for time and duration formatting
 */

/**
 * Formats a duration in seconds to a human-readable string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string (e.g., "2h 15m" or "45m 30s")
 */
export const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return 'N/A';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  let formattedTime = '';
  
  if (hours > 0) {
    formattedTime += `${hours}h `;
  }
  
  if (minutes > 0 || hours > 0) {
    formattedTime += `${minutes}m `;
  }
  
  if (remainingSeconds > 0 && hours === 0) {
    formattedTime += `${remainingSeconds}s`;
  }
  
  return formattedTime.trim();
};

/**
 * Formats a date to a localized date string
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  
  const defaultOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(undefined, { ...defaultOptions, ...options });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Formats a timestamp to a relative time string (e.g., "2 hours ago")
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }
    
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
    
    return formatDate(date);
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid Date';
  }
}; 