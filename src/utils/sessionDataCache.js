import { surveyAPI, dailyTasksAPI } from '../api';
import { getCurrentUserId } from './authUtils';

let cache = null;
let cacheUserId = null;
let cacheTime = 0;
let loading = false;
let inflight = null;
let fetchGeneration = 0;
const CACHE_TTL_MS = 8000;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeSessionData(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSessionDataSnapshot() {
  return cache;
}

export function getSessionLoadingSnapshot() {
  return loading;
}

export function clearSessionDataCache() {
  cache = null;
  cacheUserId = null;
  cacheTime = 0;
  loading = false;
  inflight = null;
  fetchGeneration += 1;
  notify();
}

export async function fetchSessionData(force = false) {
  const userId = getCurrentUserId();
  if (!userId) {
    clearSessionDataCache();
    return null;
  }

  const now = Date.now();
  if (!force && cache && cacheUserId === userId && now - cacheTime < CACHE_TTL_MS) {
    return cache;
  }

  if (inflight) {
    return inflight;
  }

  const generation = fetchGeneration;

  if (!cache || force) {
    loading = true;
    notify();
  }

  const request = Promise.all([
    surveyAPI.getSurveyStatus(userId),
    dailyTasksAPI.getTodayTasks({ user_id: userId }),
    dailyTasksAPI.getStreak({ user_id: userId }),
  ])
    .then(([surveyRes, tasksRes, streakRes]) => {
      if (generation !== fetchGeneration) {
        // Superseded by clearSessionDataCache / a newer fetch — do not write stale data.
        return inflight ?? cache;
      }

      cache = {
        surveyStatus: surveyRes.data,
        todayTasks: tasksRes.data,
        streak: streakRes.data,
      };
      cacheUserId = userId;
      cacheTime = Date.now();
      if (inflight === request) inflight = null;
      loading = false;
      notify();
      return cache;
    })
    .catch((err) => {
      if (generation === fetchGeneration && inflight === request) {
        inflight = null;
        loading = false;
        notify();
      }
      throw err;
    });

  inflight = request;
  return inflight;
}

if (typeof window !== 'undefined') {
  window.addEventListener('taskCompleted', () => {
    clearSessionDataCache();
    fetchSessionData(true).catch((err) => {
      console.error('Error refreshing session data:', err);
    });
  });

  window.addEventListener('sessionLogout', () => {
    clearSessionDataCache();
  });
}
