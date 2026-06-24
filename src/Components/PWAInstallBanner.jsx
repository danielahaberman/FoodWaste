import React from 'react';
import { Alert, IconButton, Box, Button } from '@mui/material';
import {
  Close as CloseIcon,
  Share as ShareIcon,
  GetApp as InstallIcon,
} from '@mui/icons-material';
import { isChromeOnIOS } from '../utils/pwaUtils';

const PWAInstallBanner = ({
  open,
  isIOS,
  canInstallAndroid,
  onDismiss,
  onInstall,
  onLearnMore,
}) => {
  if (!open) {
    return null;
  }

  const chromeOnIOS = isChromeOnIOS();

  const message = chromeOnIOS
    ? 'Open this page in Safari to install Food Hero.'
    : isIOS
      ? 'Using iPhone? Tap Share → Add to Home Screen.'
      : 'Install Food Hero for the best app experience.';

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        px: { xs: 1, sm: 2 },
        pb: 'calc(8px + env(safe-area-inset-bottom))',
      }}
    >
      <Alert
        severity="info"
        icon={isIOS ? <ShareIcon /> : <InstallIcon />}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {canInstallAndroid && (
              <Button
                color="inherit"
                size="small"
                variant="outlined"
                onClick={onInstall}
                sx={{
                  borderColor: 'rgba(255,255,255,0.7)',
                  color: 'white',
                  minWidth: 'auto',
                  px: 1.5,
                  '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
                }}
              >
                Install
              </Button>
            )}
            <IconButton
              aria-label="Dismiss install banner"
              color="inherit"
              size="small"
              onClick={onDismiss}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Box>
        }
        sx={{
          backgroundColor: '#1976d2',
          color: 'white',
          alignItems: 'center',
          '& .MuiAlert-icon': { color: 'white' },
          boxShadow: '0 -2px 12px rgba(0,0,0,0.15)',
          cursor: isIOS && !chromeOnIOS && onLearnMore ? 'pointer' : 'default',
        }}
        onClick={isIOS && !chromeOnIOS ? onLearnMore : undefined}
      >
        {message}
      </Alert>
    </Box>
  );
};

export default PWAInstallBanner;
