import { useEffect } from 'react';
import { fetchSessionData, clearSessionDataCache } from '../utils/sessionDataCache';
import { getCurrentUserId } from '../utils/authUtils';

function loadSessionData() {
  if (getCurrentUserId()) {
    fetchSessionData().catch((error) => {
      console.error('Error loading session data:', error);
    });
  }
}

/** Loads shared survey/tasks/streak data once for the authenticated app shell. */
export default function SessionDataBootstrap({ children }) {
  useEffect(() => {
    loadSessionData();

    const onLogin = () => loadSessionData();
    const onLogout = () => clearSessionDataCache();

    window.addEventListener('sessionLogin', onLogin);
    window.addEventListener('sessionLogout', onLogout);
    return () => {
      window.removeEventListener('sessionLogin', onLogin);
      window.removeEventListener('sessionLogout', onLogout);
    };
  }, []);

  return children;
}
