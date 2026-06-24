// PWA utility functions for managing installation prompts

export const PWA_STORAGE_KEYS = {
  SEEN: 'pwa-install-prompt-seen',
  DISMISSED: 'pwa-install-prompt-dismissed',
  PERMANENTLY_DISMISSED: 'pwa-install-prompt-permanently-dismissed',
  ACCEPTED: 'pwa-install-prompt-accepted',
  BANNER_DISMISSED: 'pwa-install-banner-dismissed',
};

/**
 * Detect if the device is running iOS
 * Handles both older devices (iPad|iPhone|iPod) and newer iPads that identify as Macs
 */
export const isIOSDevice = () => {
  const ua = navigator.userAgent;
  // Check for iPhone, iPod, or iPad (older detection)
  if (/iPad|iPhone|iPod/.test(ua)) {
    return true;
  }
  // Check for newer iPads that identify as Macs but have touch support
  // Modern iPads on iOS 13+ may report as Mac in user agent but have touch support
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints && navigator.maxTouchPoints > 1) {
    return true;
  }
  return false;
};

/**
 * Chrome, Firefox, and Opera on iOS cannot install PWAs — Safari is required.
 */
export const isChromeOnIOS = () => {
  if (!isIOSDevice()) return false;
  return /CriOS|FxiOS|OPiOS|EdgiOS/.test(navigator.userAgent);
};

export const isAndroidDevice = () => /Android/i.test(navigator.userAgent);

/**
 * True for phones/tablets where a home-screen install is the intended UX.
 * Desktop browsers are excluded even if they support PWA install via the omnibar.
 */
export const isMobileLikeDevice = () => {
  if (isIOSDevice()) return true;
  if (isAndroidDevice()) return true;
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return true;
  }
  return false;
};

/**
 * Check if the app is running in standalone mode (installed as PWA)
 */
export const isStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
};

/**
 * Reset all PWA installation prompt preferences
 * This allows users to see the prompt again if they change their mind
 */
export const resetPWAPreferences = () => {
  Object.values(PWA_STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  console.log('PWA installation preferences reset. You may see the install prompt again.');
};

/**
 * Check if user has permanently dismissed the PWA installation prompt
 */
export const isPWAPermanentlyDismissed = () => {
  return localStorage.getItem(PWA_STORAGE_KEYS.PERMANENTLY_DISMISSED) === 'true';
};

/**
 * Check if user has accepted the PWA installation prompt
 */
export const isPWAAccepted = () => {
  return localStorage.getItem(PWA_STORAGE_KEYS.ACCEPTED) !== null;
};

/**
 * Get the time when the prompt was last dismissed
 */
export const getPWADismissalTime = () => {
  const dismissed = localStorage.getItem(PWA_STORAGE_KEYS.DISMISSED);
  return dismissed ? parseInt(dismissed) : null;
};

/**
 * Check if enough time has passed since last dismissal (7 days)
 */
export const canShowPWAPromptAgain = () => {
  const dismissalTime = getPWADismissalTime();
  if (!dismissalTime) return true;
  
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - dismissalTime > sevenDaysInMs;
};

// Make reset function available globally for debugging/testing
if (typeof window !== 'undefined') {
  window.resetPWAPreferences = resetPWAPreferences;
}



