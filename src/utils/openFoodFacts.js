// @ts-nocheck
/**
 * Open Food Facts API utility
 * All API calls go through our server (which handles caching and Open Food Facts API)
 */

// Use the same base URL as other API calls (will be proxied by Vite or use full URL)
const baseURL = import.meta.env.VITE_API_URL || '';
const SERVER_API_URL = `${baseURL}/api/openfoodfacts`; // Server endpoint (handles caching + API calls)

/**
 * Lookup product by barcode using Open Food Facts API
 * @param {string} barcode - The barcode number (UPC/EAN/etc)
 * @returns {Promise<Object>} Result object with success/error and product data
 */
export async function lookupProductByBarcode(barcode) {
  // Validate barcode format
  if (!barcode || typeof barcode !== 'string' || !/^\d+$/.test(barcode)) {
    return {
      success: false,
      error: 'INVALID_BARCODE',
      message: 'Invalid barcode format. Please try scanning again.',
    };
  }

  try {
    // Call our server endpoint (server handles caching + Open Food Facts API)
    const response = await fetch(`${SERVER_API_URL}/product/${barcode}`);

    // Handle rate limiting (HTTP 429)
    if (response.status === 429) {
      const data = await response.json();
      return {
        success: false,
        error: 'RATE_LIMITED',
        message: data.message || `Too many requests. Please wait ${data.retryAfter || 60} seconds and try again.`,
        retryAfter: data.retryAfter || 60,
      };
    }

    // Handle other HTTP errors
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      if (response.status === 404 && data.error === 'NOT_FOUND') {
        return {
          success: false,
          error: 'NOT_FOUND',
          message: 'Product not found in database. Please enter details manually.',
        };
      }
      return {
        success: false,
        error: 'API_ERROR',
        message: data.message || `Server returned status ${response.status}. Please try again later.`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      product: data.product,
      cached: data.cached || false,
    };
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to connect to server. Please check your internet connection.',
      };
    }

    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Search products by name using Open Food Facts API
 * @param {string} searchTerm - The search query (product name)
 * @param {number} pageSize - Number of results to return (default: 20, max: 100)
 * @returns {Promise<Object>} Result object with success/error and products array
 */
export async function searchProductsByName(searchTerm, pageSize = 20) {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return {
      success: false,
      error: 'INVALID_SEARCH',
      message: 'Search term must be at least 2 characters.',
    };
  }

  try {
    // Call our server endpoint (server handles caching + Open Food Facts API)
    const response = await fetch(`${SERVER_API_URL}/search?term=${encodeURIComponent(searchTerm)}&pageSize=${pageSize}`);

    // Handle rate limiting (HTTP 429)
    if (response.status === 429) {
      const data = await response.json();
      return {
        success: false,
        error: 'RATE_LIMITED',
        message: data.message || `⚠️ Rate limit exceeded (HTTP 429). Please wait ${data.retryAfter || 60} seconds before searching again. Repeated violations may result in temporary IP blocking.`,
        retryAfter: data.retryAfter || 60,
      };
    }

    // Handle other HTTP errors
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        error: 'API_ERROR',
        message: data.message || `Server returned status ${response.status}. Please try again later.`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      products: data.products || [],
      cached: data.cached || false,
    };
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to connect to server. Please check your internet connection.',
      };
    }

    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Clear server cache (admin function)
 */
export async function clearProductCache() {
  try {
    const response = await fetch(`${SERVER_API_URL}/clear`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Error clearing server cache:', error);
    return false;
  }
}

