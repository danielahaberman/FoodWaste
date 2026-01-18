import { useState, useEffect, useCallback } from 'react';
import { checkForUpdate, storeAppVersion, UPDATE_CHECK_INTERVAL } from '../utils/appUpdate';

/**
 * Hook to detect app updates and manage update state
 */
export const useAppUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [storedVersion, setStoredVersion] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const performUpdateCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await checkForUpdate();
      // Only show update if we have both versions and update is available
      // This prevents false positives for users without stored version
      if (result.currentVersion && result.storedVersion) {
        setUpdateAvailable(result.hasUpdate || false);
        setCurrentVersion(result.currentVersion);
        setStoredVersion(result.storedVersion);
      } else {
        // User doesn't have stored version yet (beta user) or version fetch failed
        // Don't show update prompt, but store current version if available
        setUpdateAvailable(false);
        if (result.currentVersion) {
          setCurrentVersion(result.currentVersion);
        }
        setStoredVersion(result.storedVersion || null);
      }
    } catch (error) {
      // Silently fail - don't break app for existing users
      console.error('Update check failed:', error);
      setUpdateAvailable(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    // Initial check on mount
    performUpdateCheck();

    // Set up periodic checks
    const interval = setInterval(performUpdateCheck, UPDATE_CHECK_INTERVAL);

    // Also check when window regains focus (user comes back to app)
    const handleFocus = () => {
      performUpdateCheck();
    };
    window.addEventListener('focus', handleFocus);

    // Check for service worker updates
    let handleSWUpdate;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          // Check for service worker updates
          registration.update();
          
          // Listen for service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is ready, app update available
                  performUpdateCheck();
                }
              });
            }
          });
        }
      });
      
      // Listen for custom event from main.jsx when service worker update is detected
      handleSWUpdate = () => {
        performUpdateCheck();
      };
      window.addEventListener('sw-update-available', handleSWUpdate);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      if (handleSWUpdate) {
        window.removeEventListener('sw-update-available', handleSWUpdate);
      }
    };
  }, [performUpdateCheck]);

  const dismissUpdate = useCallback(() => {
    // Store current version to dismiss update prompt
    if (currentVersion) {
      storeAppVersion(currentVersion);
      setUpdateAvailable(false);
    }
  }, [currentVersion]);

  const applyUpdate = useCallback(() => {
    // Store the new version and reload
    if (currentVersion) {
      storeAppVersion(currentVersion);
    }
    // Force reload bypassing cache
    window.location.replace(window.location.href);
  }, [currentVersion]);
  
  // Auto-update when new version is detected (optional - can be disabled)
  useEffect(() => {
    if (updateAvailable && currentVersion && storedVersion) {
      // Auto-reload after a short delay to show the update prompt briefly
      // Set AUTO_UPDATE_DELAY to 0 for immediate update, or higher for user to see prompt
      const AUTO_UPDATE_DELAY = 0; // milliseconds - 0 = immediate, 3000 = 3 seconds
      
      if (AUTO_UPDATE_DELAY > 0) {
        const timer = setTimeout(() => {
          applyUpdate();
        }, AUTO_UPDATE_DELAY);
        return () => clearTimeout(timer);
      } else {
        // Immediate update
        applyUpdate();
      }
    }
  }, [updateAvailable, currentVersion, storedVersion, applyUpdate]);

  return {
    updateAvailable,
    currentVersion,
    storedVersion,
    isChecking,
    checkForUpdate: performUpdateCheck,
    dismissUpdate,
    applyUpdate,
  };
};

