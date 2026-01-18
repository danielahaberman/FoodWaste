// Error logging utility for storing errors in localStorage

const ERROR_STORAGE_KEY = 'app_errors';
const MAX_ERRORS = 100; // Keep last 100 errors

/**
 * Log an error to localStorage
 * @param {Error|string} error - The error object or error message
 * @param {Object} context - Additional context about where the error occurred
 */
export const logError = (error, context = {}) => {
  try {
    const errors = getStoredErrors();
    
    const errorEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        pathname: window.location.pathname,
      },
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
    };

    errors.unshift(errorEntry); // Add to beginning
    
    // Keep only the last MAX_ERRORS errors
    if (errors.length > MAX_ERRORS) {
      errors.splice(MAX_ERRORS);
    }

    localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errors));
    
    console.error('[ErrorLogger] Logged error:', errorEntry);
  } catch (e) {
    // If we can't log to localStorage, at least log to console
    console.error('[ErrorLogger] Failed to log error:', e);
    console.error('[ErrorLogger] Original error:', error);
  }
};

/**
 * Get all stored errors
 * @returns {Array} Array of error entries
 */
export const getStoredErrors = () => {
  try {
    const stored = localStorage.getItem(ERROR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('[ErrorLogger] Failed to read stored errors:', e);
    return [];
  }
};

/**
 * Clear all stored errors
 */
export const clearErrors = () => {
  try {
    localStorage.removeItem(ERROR_STORAGE_KEY);
    console.log('[ErrorLogger] Cleared all errors');
  } catch (e) {
    console.error('[ErrorLogger] Failed to clear errors:', e);
  }
};

/**
 * Get error count
 * @returns {number} Number of stored errors
 */
export const getErrorCount = () => {
  return getStoredErrors().length;
};

/**
 * Get latest error
 * @returns {Object|null} Latest error entry or null
 */
export const getLatestError = () => {
  const errors = getStoredErrors();
  return errors.length > 0 ? errors[0] : null;
};

