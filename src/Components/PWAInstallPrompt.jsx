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
  StepContent
} from '@mui/material';
import { 
  Close as CloseIcon,
  GetApp as InstallIcon,
  Share as ShareIcon,
  Add as AddIcon,
  MoreVert as MenuIcon,
  PhoneAndroid as AndroidIcon,
  PhoneIphone as IOSIcon
} from '@mui/icons-material';
import { PWA_STORAGE_KEYS } from '../utils/pwaUtils';

const PWAInstallPrompt = ({ open, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [detectedIOS, setDetectedIOS] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null); // 'ios' or 'android'
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setDetectedIOS(iOS);
    // Set initial platform based on detection
    setSelectedPlatform(iOS ? 'ios' : 'android');

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
        title: 'Food Hero',
        text: 'Check out Food Hero - track and reduce food waste!',
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
          borderRadius: { xs: 1, sm: 2 },
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          margin: { xs: 1.5, sm: 2 },
          maxHeight: { xs: 'calc(100vh - 24px)', sm: '90vh' },
          height: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: { xs: 0.5, sm: 1 },
        px: { xs: 1.5, sm: 3 },
        pt: { xs: 1.5, sm: 3 }
      }}>
        <Typography variant="h6" sx={{ 
          color: '#1976d2', 
          fontWeight: 'bold',
          fontSize: { xs: '1rem', sm: '1.25rem' }
        }}>
          Install App
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ p: 0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ 
        pt: { xs: 0.5, sm: 1 },
        px: { xs: 1.5, sm: 3 },
        pb: { xs: 1, sm: 2 },
        flex: '1 1 auto',
        overflow: 'auto'
      }}>
        <Typography variant="body1" sx={{ 
          mb: { xs: 1.5, sm: 2 }, 
          color: '#666',
          fontSize: { xs: '0.875rem', sm: '1rem' },
          lineHeight: 1.4
        }}>
          Install the app on your device for a better experience!
        </Typography>

        {/* Platform Selector */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          mb: { xs: 1.5, sm: 2 },
          justifyContent: 'center'
        }}>
          <Button
            variant={selectedPlatform === 'ios' ? 'contained' : 'outlined'}
            onClick={() => setSelectedPlatform('ios')}
            startIcon={<IOSIcon />}
            sx={{
              flex: 1,
              backgroundColor: selectedPlatform === 'ios' ? '#1976d2' : 'transparent',
              color: selectedPlatform === 'ios' ? 'white' : '#1976d2',
              borderColor: '#1976d2',
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              py: { xs: 0.75, sm: 0.5 },
              '&:hover': {
                backgroundColor: selectedPlatform === 'ios' ? '#1565c0' : 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            iOS
          </Button>
          <Button
            variant={selectedPlatform === 'android' ? 'contained' : 'outlined'}
            onClick={() => setSelectedPlatform('android')}
            startIcon={<AndroidIcon />}
            sx={{
              flex: 1,
              backgroundColor: selectedPlatform === 'android' ? '#1976d2' : 'transparent',
              color: selectedPlatform === 'android' ? 'white' : '#1976d2',
              borderColor: '#1976d2',
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              py: { xs: 0.75, sm: 0.5 },
              '&:hover': {
                backgroundColor: selectedPlatform === 'android' ? '#1565c0' : 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            Android
          </Button>
        </Box>

        {selectedPlatform === 'ios' ? (
          // iOS Instructions
          <Box>
            <Typography variant="h6" sx={{ 
              mb: { xs: 1, sm: 1.5 }, 
              color: '#1976d2',
              fontSize: { xs: '0.95rem', sm: '1.25rem' },
              fontWeight: 600
            }}>
              How to install on iOS:
            </Typography>
            
            <Stepper 
              orientation="vertical" 
              sx={{ 
                pl: 0,
                '& .MuiStep-root': {
                  paddingBottom: { xs: 0.5, sm: 1 }
                },
                '& .MuiStepLabel-root': { 
                  px: { xs: 0, sm: 1 },
                  paddingTop: { xs: 0.5, sm: 1 }
                },
                '& .MuiStepContent-root': {
                  paddingLeft: { xs: 2.5, sm: 3.5 },
                  marginTop: { xs: 0.25, sm: 0.5 }
                }
              }}
            >
              <Step active>
                <StepLabel>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 }
                  }}>
                    <ShareIcon color="primary" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }} />
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      Tap the Share button
                    </Typography>
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, lineHeight: 1.3 }}>
                    Look for the share icon in your browser's toolbar
                  </Typography>
                </StepContent>
              </Step>
              
              <Step active>
                <StepLabel>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 }
                  }}>
                    <AddIcon color="primary" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }} />
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      Add to Home Screen
                    </Typography>
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, lineHeight: 1.3 }}>
                    Scroll down and tap "Add to Home Screen"
                  </Typography>
                </StepContent>
              </Step>
            </Stepper>
          </Box>
        ) : (
          // Android Instructions
          <Box>
            {deferredPrompt ? (
              <Typography variant="body2" sx={{ 
                mb: { xs: 1, sm: 1.5 }, 
                color: '#1976d2',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                fontStyle: 'italic',
                textAlign: 'center',
                p: 1,
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                borderRadius: 1
              }}>
                💡 Quick install: Tap "Install App" below, or follow the manual steps if needed.
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ 
                mb: { xs: 1, sm: 1.5 }, 
                color: '#666',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                textAlign: 'center',
                p: 1,
                backgroundColor: '#f5f5f5',
                borderRadius: 1
              }}>
                Follow these steps to install the app manually:
              </Typography>
            )}
            
            <Typography variant="h6" sx={{ 
              mb: { xs: 1, sm: 1.5 }, 
              color: '#1976d2',
              fontSize: { xs: '0.95rem', sm: '1.25rem' },
              fontWeight: 600
            }}>
              How to install on Android:
            </Typography>
            
            <Stepper 
              orientation="vertical" 
              sx={{ 
                pl: 0,
                '& .MuiStep-root': {
                  paddingBottom: { xs: 0.5, sm: 1 }
                },
                '& .MuiStepLabel-root': { 
                  px: { xs: 0, sm: 1 },
                  paddingTop: { xs: 0.5, sm: 1 }
                },
                '& .MuiStepContent-root': {
                  paddingLeft: { xs: 2.5, sm: 3.5 },
                  marginTop: { xs: 0.25, sm: 0.5 }
                }
              }}
            >
              <Step active>
                <StepLabel>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 }
                  }}>
                    <MenuIcon color="primary" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }} />
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      Open the browser menu
                    </Typography>
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, lineHeight: 1.3 }}>
                    Tap the three dots icon (⋮) in the top-right corner of your browser
                  </Typography>
                </StepContent>
              </Step>
              
              <Step active>
                <StepLabel>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 }
                  }}>
                    <InstallIcon color="primary" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }} />
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      Tap "Install app" or "Add to Home screen"
                    </Typography>
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, lineHeight: 1.3 }}>
                    Look for "Install app" or "Add to Home screen" in the menu and tap it
                  </Typography>
                </StepContent>
              </Step>
              
              <Step active>
                <StepLabel>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 }
                  }}>
                    <AddIcon color="primary" sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }} />
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      Confirm installation
                    </Typography>
                  </Box>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, lineHeight: 1.3 }}>
                    Tap "Install" in the popup to add the app to your home screen
                  </Typography>
                </StepContent>
              </Step>
            </Stepper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: { xs: 1.5, sm: 3 }, 
        pt: { xs: 0.5, sm: 1 },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 0.75, sm: 1 },
        '& > *': {
          width: { xs: '100%', sm: 'auto' },
          margin: { xs: '0 !important', sm: '0 8px !important' },
          minWidth: { xs: 'auto', sm: 'auto' }
        }
      }}>
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
            },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            py: { xs: 0.5, sm: 0.5 },
            order: { xs: -1, sm: 0 },
            alignSelf: { xs: 'flex-end', sm: 'auto' },
            minWidth: { xs: 'auto', sm: 'auto' },
            px: { xs: 1, sm: 1.5 }
          }}
        >
          Don't Ask Again
        </Button>

        {selectedPlatform === 'ios' ? (
          <Button 
            onClick={handleShareClick}
            variant="contained"
            startIcon={<ShareIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': { backgroundColor: '#1565c0' },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              py: { xs: 1, sm: 0.75 },
              px: { xs: 2, sm: 2 }
            }}
          >
            Open Share Menu
          </Button>
        ) : (
          deferredPrompt ? (
            <Button 
              onClick={handleInstallClick}
              variant="contained"
              startIcon={<InstallIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />}
              sx={{
                backgroundColor: '#1976d2',
                '&:hover': { backgroundColor: '#1565c0' },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                py: { xs: 1, sm: 0.75 },
                px: { xs: 2, sm: 2 }
              }}
            >
              Install App
            </Button>
          ) : null
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
            },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            py: { xs: 1, sm: 0.75 },
            px: { xs: 2, sm: 2 }
          }}
        >
          Maybe Later
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PWAInstallPrompt;
