import React from 'react';
import PWAInstallPrompt from './PWAInstallPrompt';
import { usePWAInstall } from '../hooks/usePWAInstall';

const PWAProvider = ({ children }) => {
  const { showInstallPrompt, handleDismiss } = usePWAInstall();

  return (
    <>
      {children}
      <PWAInstallPrompt 
        open={showInstallPrompt} 
        onClose={handleDismiss} 
      />
    </>
  );
};

export default PWAProvider;



