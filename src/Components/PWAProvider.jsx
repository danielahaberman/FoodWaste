import React from 'react';
import PWAInstallPrompt from './PWAInstallPrompt';
import PWAInstallBanner from './PWAInstallBanner';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAContext } from '../context/PWAContext';

const PWAProvider = ({ children }) => {
  const pwa = usePWAInstall();

  return (
    <PWAContext.Provider value={pwa}>
      {children}
      <PWAInstallBanner
        open={pwa.showInstallBanner}
        isIOS={pwa.isIOS}
        canInstallAndroid={pwa.canInstallAndroid}
        onDismiss={pwa.dismissInstallBanner}
        onInstall={pwa.handleInstall}
        onLearnMore={pwa.openInstallPrompt}
      />
      <PWAInstallPrompt
        open={pwa.showInstallPrompt}
        onClose={pwa.handleDismiss}
        onInstall={pwa.handleInstall}
        onPermanentDismiss={pwa.handlePermanentDismiss}
        isIOS={pwa.isIOS}
        canInstallAndroid={pwa.canInstallAndroid}
      />
    </PWAContext.Provider>
  );
};

export default PWAProvider;
