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
      if (result.currentVersion && result.storedVersion) {
        setUpdateAvailable(result.hasUpdate || false);
        setCurrentVersion(result.currentVersion);
        setStoredVersion(result.storedVersion);
      } else {
        setUpdateAvailable(false);
        if (result.currentVersion) {
          setCurrentVersion(result.currentVersion);
        }
        setStoredVersion(result.storedVersion || null);
      }
    } catch {
      setUpdateAvailable(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    performUpdateCheck();

    const interval = setInterval(performUpdateCheck, UPDATE_CHECK_INTERVAL);

    const handleFocus = () => {
      performUpdateCheck();
    };
    window.addEventListener('focus', handleFocus);

    const handleSWUpdate = () => {
      performUpdateCheck();
    };
    window.addEventListener('sw-update-available', handleSWUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('sw-update-available', handleSWUpdate);
    };
  }, [performUpdateCheck]);

  const dismissUpdate = useCallback(() => {
    if (currentVersion) {
      storeAppVersion(currentVersion);
      setUpdateAvailable(false);
    }
  }, [currentVersion]);

  const applyUpdate = useCallback(() => {
    if (currentVersion) {
      storeAppVersion(currentVersion);
    }
    window.location.replace(window.location.href);
  }, [currentVersion]);

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
