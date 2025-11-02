import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper
} from '@mui/material';
import { 
  Close as CloseIcon,
  GetApp as InstallIcon,
  Share as ShareIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { PWA_STORAGE_KEYS } from '../utils/pwaUtils';

const PWAInstallPrompt = ({ open, onClose }) => {
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
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt for Android
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      onClose();
    }
  };

  const handleShareClick = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Food Waste Tracker',
        text: 'Check out this food waste tracking app!',
        url: window.location.href,
      });
    }
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          Install App
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
          Install the app on your device for a better experience!
        </Typography>

        {isIOS ? (
          // iOS Instructions
          <Box>
            <Typography variant="h6" sx={{ mb: 2, color: '#1976d2' }}>
              How to install on iOS:
            </Typography>
            
            <Stepper orientation="vertical" sx={{ pl: 0 }}>
              <Step active>
                <StepLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShareIcon color="primary" />
                    <Typography variant="body1">Tap the Share button</Typography>
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    Look for the share icon in your browser's toolbar
                  </Typography>
                </StepContent>
              </Step>
              
              <Step active>
                <StepLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddIcon color="primary" />
                    <Typography variant="body1">Add to Home Screen</Typography>
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    Scroll down and tap "Add to Home Screen"
                  </Typography>
                </StepContent>
              </Step>
            </Stepper>

            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                mt: 2, 
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                <strong>Tip:</strong> Once installed, the app will work offline and feel like a native app!
              </Typography>
            </Paper>
          </Box>
        ) : (
          // Android Install Button
          <Box sx={{ textAlign: 'center' }}>
            <InstallIcon sx={{ fontSize: 64, color: '#1976d2', mb: 2 }} />
            <Typography variant="body1" sx={{ mb: 3 }}>
              Tap the button below to install the app on your device
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        {isIOS ? (
          <Button 
            onClick={handleShareClick}
            variant="contained"
            startIcon={<ShareIcon />}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': { backgroundColor: '#1565c0' }
            }}
          >
            Open Share Menu
          </Button>
        ) : (
          <Button 
            onClick={handleInstallClick}
            variant="contained"
            startIcon={<InstallIcon />}
            disabled={!deferredPrompt}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': { backgroundColor: '#1565c0' }
            }}
          >
            Install App
          </Button>
        )}
        
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: '#1976d2',
            color: '#1976d2',
            '&:hover': { 
              borderColor: '#1565c0',
              backgroundColor: 'rgba(25, 118, 210, 0.04)'
            }
          }}
        >
          Maybe Later
        </Button>
        
        <Button 
          onClick={() => {
            localStorage.setItem(PWA_STORAGE_KEYS.PERMANENTLY_DISMISSED, 'true');
            onClose();
          }}
          variant="text"
          sx={{
            color: '#666',
            '&:hover': { 
              backgroundColor: 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          Don't Ask Again
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PWAInstallPrompt;
