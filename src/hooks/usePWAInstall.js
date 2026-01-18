import { useState, useEffect } from 'react';
import { PWA_STORAGE_KEYS, isPWAPermanentlyDismissed, canShowPWAPromptAgain, isIOSDevice, isStandaloneMode } from '../utils/pwaUtils';
import { surveyAPI } from '../api';
import { getCurrentUserId } from '../utils/authUtils';

export const usePWAInstall = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInitialSurveyCompleted, setIsInitialSurveyCompleted] = useState(true); // Default to true to avoid blocking

  useEffect(() => {
    // Check if initial survey is completed
    const checkSurveyStatus = async () => {
      try {
        const userId = getCurrentUserId();
        if (userId) {
          const response = await surveyAPI.getSurveyStatus(userId);
          const completed = response.data?.initialCompleted ?? true;
          setIsInitialSurveyCompleted(completed);
          return completed;
        }
        return true; // If no userId, assume completed
      } catch (error) {
        // On error, assume survey is completed to avoid blocking PWA prompt
        console.error("Error checking survey status for PWA prompt:", error);
        setIsInitialSurveyCompleted(true);
        return true;
      }
    };

    // Check if running on iOS (using improved detection)
    const iOS = isIOSDevice();
    setIsIOS(iOS);

    // Check if already installed (standalone mode)
    const standalone = isStandaloneMode();
    setIsStandalone(standalone);

    // Function to check if we should show the prompt
    const shouldShowPromptCheck = async () => {
      // Check if user permanently dismissed the prompt
      if (isPWAPermanentlyDismissed()) {
        return false;
      }
      
      // Check if initial survey is completed
      const surveyCompleted = await checkSurveyStatus();
      if (!surveyCompleted) {
        return false; // Don't show if survey not completed
      }
      
      // Check if we should show the prompt
      const hasSeenPrompt = localStorage.getItem(PWA_STORAGE_KEYS.SEEN);
      
      // Show prompt if:
      // 1. User hasn't seen it before, OR
      // 2. User dismissed it more than 7 days ago
      return !hasSeenPrompt || canShowPWAPromptAgain();
    };

    // Listen for the beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = async (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const shouldShow = await shouldShowPromptCheck();
      if (shouldShow) {
        setShowInstallPrompt(true);
        localStorage.setItem(PWA_STORAGE_KEYS.SEEN, Date.now().toString());
      }
    };

    // For iOS, check and show prompt on first visit or after 7 days
    if (iOS && !standalone) {
      shouldShowPromptCheck().then(shouldShow => {
        if (shouldShow) {
          setShowInstallPrompt(true);
          localStorage.setItem(PWA_STORAGE_KEYS.SEEN, Date.now().toString());
        }
      });
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        localStorage.setItem(PWA_STORAGE_KEYS.ACCEPTED, Date.now().toString());
      } else {
        console.log('User dismissed the install prompt');
        localStorage.setItem(PWA_STORAGE_KEYS.DISMISSED, Date.now().toString());
      }
      
      setDeferredPrompt(null);
    }
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem(PWA_STORAGE_KEYS.DISMISSED, Date.now().toString());
  };

  const [isDailyTasksPopupOpen, setIsDailyTasksPopupOpen] = useState(false);

  // Listen for daily tasks popup open/close events
  useEffect(() => {
    const handleDailyTasksOpen = () => setIsDailyTasksPopupOpen(true);
    const handleDailyTasksClose = () => setIsDailyTasksPopupOpen(false);

    window.addEventListener('dailyTasksPopupOpen', handleDailyTasksOpen);
    window.addEventListener('dailyTasksPopupClose', handleDailyTasksClose);

    return () => {
      window.removeEventListener('dailyTasksPopupOpen', handleDailyTasksOpen);
      window.removeEventListener('dailyTasksPopupClose', handleDailyTasksClose);
    };
  }, []);

  const canInstall = deferredPrompt !== null || isIOS;
  // Don't show PWA prompt if:
  // - Initial survey is not completed (welcome modal is showing)
  // - Daily tasks popup is open
  const shouldShowPrompt = showInstallPrompt && !isStandalone && canInstall && isInitialSurveyCompleted && !isDailyTasksPopupOpen;

  return {
    showInstallPrompt: shouldShowPrompt,
    handleInstall,
    handleDismiss,
    isIOS,
    isStandalone,
    canInstall
  };
};
