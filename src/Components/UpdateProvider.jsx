import React from 'react';
import UpdatePrompt from './UpdatePrompt';
import { useAppUpdate } from '../hooks/useAppUpdate';

const UpdateProvider = ({ children }) => {
  const {
    updateAvailable,
    currentVersion,
    storedVersion,
    dismissUpdate,
    applyUpdate,
  } = useAppUpdate();

  return (
    <>
      {children}
      <UpdatePrompt
        open={updateAvailable}
        onUpdate={applyUpdate}
        onDismiss={dismissUpdate}
        currentVersion={currentVersion}
        storedVersion={storedVersion}
      />
    </>
  );
};

export default UpdateProvider;

