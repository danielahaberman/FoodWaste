import { useEffect } from 'react';
import { fetchSessionData } from '../utils/sessionDataCache';
import { getCurrentUserId } from '../utils/authUtils';

/** Loads shared survey/tasks/streak data once for the authenticated app shell. */
export default function SessionDataBootstrap({ children }) {
  useEffect(() => {
    if (getCurrentUserId()) {
      fetchSessionData().catch((error) => {
        console.error('Error loading session data:', error);
      });
    }
  }, []);

  return children;
}
