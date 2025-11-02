// PWA utility functions for managing installation prompts

export const PWA_STORAGE_KEYS = {
  SEEN: 'pwa-install-prompt-seen',
  DISMISSED: 'pwa-install-prompt-dismissed',
  PERMANENTLY_DISMISSED: 'pwa-install-prompt-permanently-dismissed',
  ACCEPTED: 'pwa-install-prompt-accepted'
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



