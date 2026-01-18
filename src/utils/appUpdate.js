// App update detection utilities

const VERSION_STORAGE_KEY = 'app_version';
const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

/**
 * Get the current app version from version.json
 */
export const getCurrentAppVersion = async () => {
  try {
    const response = await fetch('/version.json?t=' + Date.now()); // Cache bust
    const data = await response.json();
    return data.version;
  } catch (error) {
    console.error('Failed to fetch app version:', error);
    return null;
  }
};

/**
 * Get the stored app version from localStorage
 */
export const getStoredAppVersion = () => {
  return localStorage.getItem(VERSION_STORAGE_KEY);
};

/**
 * Store the current app version in localStorage
 */
export const storeAppVersion = (version) => {
  localStorage.setItem(VERSION_STORAGE_KEY, version);
};

/**
 * Compare two version strings (e.g., "1.0.3" vs "1.0.4")
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export const compareVersions = (v1, v2) => {
  if (!v1 || !v2) return 0;
  
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
};

/**
 * Check if there's a new version available
 * Handles users without stored version gracefully (backward compatibility)
 */
export const checkForUpdate = async () => {
  try {
    const currentVersion = await getCurrentAppVersion();
    const storedVersion = getStoredAppVersion();
    
    // If we can't fetch current version, don't show update prompt
    // This prevents breaking existing users
    if (!currentVersion) {
      console.warn('Could not fetch current version, skipping update check');
      return { hasUpdate: false, currentVersion: null, storedVersion };
    }
    
    // If no stored version (existing beta users), store current and return no update
    // This ensures they won't see a false update prompt on next check
    if (!storedVersion) {
      storeAppVersion(currentVersion);
      return { hasUpdate: false, currentVersion, storedVersion: null };
    }
    
    // Compare versions
    const comparison = compareVersions(currentVersion, storedVersion);
    const hasUpdate = comparison > 0; // Current version is newer than stored
    
    return {
      hasUpdate,
      currentVersion,
      storedVersion,
      isNewer: comparison > 0,
    };
  } catch (error) {
    // Silently fail for backward compatibility - don't break existing users
    console.error('Error checking for update:', error);
    return { hasUpdate: false, error: error.message };
  }
};

/**
 * Force reload the app to get the latest version
 * Uses modern reload method with cache bypass
 */
export const reloadApp = () => {
  // Force reload bypassing cache
  // Using replace to avoid adding to history
  window.location.replace(window.location.href);
};

export { UPDATE_CHECK_INTERVAL };

