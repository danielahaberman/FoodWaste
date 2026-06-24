import React from 'react';
import {
  SwipeableDrawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  GetApp as InstallIcon,
  Share as ShareIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { isChromeOnIOS } from '../utils/pwaUtils';

const IOSInstructions = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      <ShareIcon color="primary" sx={{ mt: 0.25 }} />
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          1. Tap Share
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tap the Share button at the bottom of Safari (square with an arrow pointing up).
        </Typography>
      </Box>
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      <AddIcon color="primary" sx={{ mt: 0.25 }} />
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          2. Add to Home Screen
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Scroll the share menu and tap &quot;Add to Home Screen&quot;, then tap Add.
        </Typography>
      </Box>
    </Box>
  </Box>
);

const AndroidInstructions = ({ hasNativePrompt }) => (
  <Box>
    {hasNativePrompt ? (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Tap Install App below to add Food Hero to your home screen.
      </Typography>
    ) : (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Open your browser menu (⋮) and choose &quot;Install app&quot; or &quot;Add to Home screen&quot;.
      </Typography>
    )}
  </Box>
);

const PromptContent = ({
  isIOS,
  canInstallAndroid,
  onClose,
  onInstall,
  onPermanentDismiss,
}) => {
  const chromeOnIOS = isChromeOnIOS();

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          Install App
        </Typography>
        <IconButton onClick={onClose} size="small" aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Install Food Hero for a full-screen app experience without the app store.
      </Typography>

      {chromeOnIOS ? (
        <Typography
          variant="body2"
          sx={{
            color: '#d32f2f',
            p: 1.5,
            backgroundColor: '#ffebee',
            borderRadius: 1,
            border: '1px solid #ffcdd2',
          }}
        >
          Chrome on iPhone cannot install apps. Copy this URL and open it in Safari, then use Share → Add to Home Screen.
        </Typography>
      ) : isIOS ? (
        <IOSInstructions />
      ) : (
        <AndroidInstructions hasNativePrompt={canInstallAndroid} />
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 3 }}>
        {!isIOS && canInstallAndroid && (
          <Button
            onClick={onInstall}
            variant="contained"
            startIcon={<InstallIcon />}
            fullWidth
            sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
          >
            Install App
          </Button>
        )}
        <Button onClick={onClose} variant="outlined" fullWidth>
          Maybe Later
        </Button>
        <Button onClick={onPermanentDismiss} variant="text" size="small" sx={{ color: '#666' }}>
          Don&apos;t Ask Again
        </Button>
      </Box>
    </>
  );
};

const PWAInstallPrompt = ({
  open,
  onClose,
  onInstall,
  onPermanentDismiss,
  isIOS,
  canInstallAndroid,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            px: 2,
            pt: 2,
            pb: 'calc(16px + env(safe-area-inset-bottom))',
            maxHeight: '85dvh',
          },
        }}
      >
        <PromptContent
          isIOS={isIOS}
          canInstallAndroid={canInstallAndroid}
          onClose={onClose}
          onInstall={onInstall}
          onPermanentDismiss={onPermanentDismiss}
        />
      </SwipeableDrawer>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'none' }}>Install App</DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <PromptContent
          isIOS={isIOS}
          canInstallAndroid={canInstallAndroid}
          onClose={onClose}
          onInstall={onInstall}
          onPermanentDismiss={onPermanentDismiss}
        />
      </DialogContent>
      <DialogActions sx={{ display: 'none' }} />
    </Dialog>
  );
};

export default PWAInstallPrompt;
