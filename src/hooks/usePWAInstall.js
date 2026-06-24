import { useState, useEffect, useCallback } from 'react';
import {
  PWA_STORAGE_KEYS,
  isPWAPermanentlyDismissed,
  isIOSDevice,
  isStandaloneMode,
  isChromeOnIOS,
} from '../utils/pwaUtils';

export const usePWAInstall = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDailyTasksPopupOpen, setIsDailyTasksPopupOpen] = useState(false);

  useEffect(() => {
    const iOS = isIOSDevice();
    const standalone = isStandaloneMode();

    setIsIOS(iOS);
    setIsStandalone(standalone);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS Safari: show the lightweight banner automatically (no blocking dialog)
    if (
      iOS &&
      !standalone &&
      !isChromeOnIOS() &&
      !isPWAPermanentlyDismissed() &&
      localStorage.getItem(PWA_STORAGE_KEYS.BANNER_DISMISSED) !== 'true'
    ) {
      setShowInstallBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

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

  const openInstallPrompt = useCallback(() => {
    if (isStandaloneMode() || isPWAPermanentlyDismissed()) {
      return;
    }
    setShowInstallPrompt(true);
    localStorage.setItem(PWA_STORAGE_KEYS.SEEN, Date.now().toString());
  }, []);

  const showPostLoginBanner = useCallback(() => {
    if (isStandaloneMode() || isPWAPermanentlyDismissed()) {
      return;
    }
    if (localStorage.getItem(PWA_STORAGE_KEYS.BANNER_DISMISSED) === 'true') {
      return;
    }
    setShowInstallBanner(true);
  }, []);

  const dismissInstallBanner = useCallback(() => {
    setShowInstallBanner(false);
    localStorage.setItem(PWA_STORAGE_KEYS.BANNER_DISMISSED, 'true');
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        localStorage.setItem(PWA_STORAGE_KEYS.ACCEPTED, Date.now().toString());
      } else {
        localStorage.setItem(PWA_STORAGE_KEYS.DISMISSED, Date.now().toString());
      }

      setDeferredPrompt(null);
    }
    setShowInstallPrompt(false);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem(PWA_STORAGE_KEYS.DISMISSED, Date.now().toString());
  };

  const handlePermanentDismiss = () => {
    localStorage.setItem(PWA_STORAGE_KEYS.PERMANENTLY_DISMISSED, 'true');
    setShowInstallPrompt(false);
    setShowInstallBanner(false);
  };

  const canInstallAndroid = deferredPrompt !== null;
  const canInstallIOS = isIOS && !isChromeOnIOS();
  const canInstall = canInstallAndroid || canInstallIOS;

  const shouldShowPrompt =
    showInstallPrompt && !isStandalone && canInstall && !isDailyTasksPopupOpen;

  const shouldShowBanner =
    showInstallBanner &&
    !isStandalone &&
    !isPWAPermanentlyDismissed() &&
    !isDailyTasksPopupOpen &&
    (canInstallIOS || canInstallAndroid);

  return {
    showInstallPrompt: shouldShowPrompt,
    showInstallBanner: shouldShowBanner,
    openInstallPrompt,
    showPostLoginBanner,
    dismissInstallBanner,
    handleInstall,
    handleDismiss,
    handlePermanentDismiss,
    deferredPrompt,
    isIOS,
    isStandalone,
    canInstall,
    canInstallAndroid,
  };
};
