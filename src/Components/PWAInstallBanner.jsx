import React from 'react';
import {
  Alert,
  Button,
  IconButton,
  Snackbar,
  Box,
} from '@mui/material';
import {
  Close as CloseIcon,
  Share as ShareIcon,
  GetApp as InstallIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { isChromeOnIOS } from '../utils/pwaUtils';
import { primaryAlertSx } from '../themeStyles';
import { BOTTOM_NAV_HEIGHT } from './PageWrapper';

const BOTTOM_NAV_ROUTES = ['/summary', '/survey', '/survey-progress', '/log', '/tasks', '/settings', '/resources', '/home', '/tasks-leaderboard'];

const PWAInstallBanner = ({
  open,
  isIOS,
  canInstallAndroid,
  onDismiss,
  onInstall,
  onLearnMore,
}) => {
  const location = useLocation();
  const hasBottomNav = BOTTOM_NAV_ROUTES.some(
    (route) => location.pathname === route || location.pathname.startsWith(`${route}/`)
  );

  const chromeOnIOS = isChromeOnIOS();

  const message = chromeOnIOS
    ? 'Open this page in Safari to install Food Hero.'
    : isIOS
      ? 'Using iPhone? Tap Share → Add to Home Screen.'
      : 'Install Food Hero for the best app experience.';

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{
        bottom: hasBottomNav ? BOTTOM_NAV_HEIGHT : 'calc(8px + env(safe-area-inset-bottom, 0px))',
        left: { xs: 8, sm: 16 },
        right: { xs: 8, sm: 16 },
        maxWidth: 600,
        mx: 'auto',
        zIndex: 1200,
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
              onClick={onDismiss}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Box>
        }
        sx={{
          ...primaryAlertSx,
          width: '100%',
          alignItems: 'center',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.15)',
          cursor: isIOS && !chromeOnIOS && onLearnMore ? 'pointer' : 'default',
        }}
        onClick={isIOS && !chromeOnIOS ? onLearnMore : undefined}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default PWAInstallBanner;
