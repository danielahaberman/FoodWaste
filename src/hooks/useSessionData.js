import { useCallback, useSyncExternalStore } from 'react';
import {
  fetchSessionData,
  getSessionDataSnapshot,
  getSessionLoadingSnapshot,
  subscribeSessionData,
} from '../utils/sessionDataCache';
import { getCurrentUserId } from '../utils/authUtils';

export function useSessionData() {
  const data = useSyncExternalStore(
    subscribeSessionData,
    getSessionDataSnapshot,
    getSessionDataSnapshot,
  );
  const loading = useSyncExternalStore(
    subscribeSessionData,
    getSessionLoadingSnapshot,
    getSessionLoadingSnapshot,
  );

  const refresh = useCallback(async (force = true) => {
    if (!getCurrentUserId()) {
      return null;
    }

    try {
      return await fetchSessionData(force);
    } catch (error) {
      console.error('Error loading session data:', error);
      return null;
    }
  }, []);

  return { data, loading, refresh };
}
