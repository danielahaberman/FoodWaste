import { useState, useEffect } from 'react';
import { PWA_STORAGE_KEYS, isPWAPermanentlyDismissed, canShowPWAPromptAgain } from '../utils/pwaUtils';

export const usePWAInstall = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Listen for the beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user permanently dismissed the prompt
      if (isPWAPermanentlyDismissed()) {
        return; // Don't show prompt if permanently dismissed
      }
      
      // Check if we should show the prompt
      const hasSeenPrompt = localStorage.getItem(PWA_STORAGE_KEYS.SEEN);
      
      // Show prompt if:
      // 1. User hasn't seen it before, OR
      // 2. User dismissed it more than 7 days ago
      if (!hasSeenPrompt || canShowPWAPromptAgain()) {
        setShowInstallPrompt(true);
        localStorage.setItem(PWA_STORAGE_KEYS.SEEN, Date.now().toString());
      }
    };

    // For iOS, show prompt on first visit or after 7 days
    if (iOS && !standalone) {
      // Check if user permanently dismissed the prompt
      if (!isPWAPermanentlyDismissed()) {
        const hasSeenPrompt = localStorage.getItem(PWA_STORAGE_KEYS.SEEN);
        
        if (!hasSeenPrompt || canShowPWAPromptAgain()) {
          setShowInstallPrompt(true);
          localStorage.setItem(PWA_STORAGE_KEYS.SEEN, Date.now().toString());
        }
      }
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

  const canInstall = deferredPrompt !== null || isIOS;
  const shouldShowPrompt = showInstallPrompt && !isStandalone && canInstall;

  return {
    showInstallPrompt: shouldShowPrompt,
    handleInstall,
    handleDismiss,
    isIOS,
    isStandalone,
    canInstall
  };
};
