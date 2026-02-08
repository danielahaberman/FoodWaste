// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import CloseIcon from '@mui/icons-material/Close';
import FlashlightOnIcon from '@mui/icons-material/FlashlightOn';
import FlashlightOffIcon from '@mui/icons-material/FlashlightOff';

const BarcodeScanner = ({ open, onClose, onScan, onError, onManualAdd }) => {
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [noBarcodeMessage, setNoBarcodeMessage] = useState(null);
  const [stopStream, setStopStream] = useState(false);

  useEffect(() => {
    if (open) {
      setScanning(true);
      setError(null);
      setNoBarcodeMessage(null);
      setTorchEnabled(false);
      setPermissionDenied(false);
      setStopStream(false);
      checkCameraPermission();
    }
  }, [open]);

  // After a short delay, show a friendly hint + manual fallback (no error).
  useEffect(() => {
    if (!open || !scanning) return;
    const t = setTimeout(() => {
      setNoBarcodeMessage(
        'No barcode detected yet. Try steady hands, better lighting, and fill the frame. You can also use Manual entry.'
      );
    }, 6000);
    return () => clearTimeout(t);
  }, [open, scanning]);

  const checkCameraPermission = async () => {
    try {
      // Check if we can query permissions
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' });
        
        if (permissionStatus.state === 'denied') {
          setPermissionDenied(true);
          setScanning(false);
          setError('Camera permission denied. Click "Request Permission" to try again.');
          return;
        }
      }
    } catch (error) {
      // Permissions API not supported, continue normally
      console.log('Permissions API not available');
    }
  };

  const requestCameraPermission = async () => {
    try {
      // Try to access camera - this will trigger permission prompt if needed
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // If successful, stop the stream and restart scanning
      stream.getTracks().forEach(track => track.stop());
      setPermissionDenied(false);
      setError(null);
      setScanning(true);
    } catch (error) {
      console.error('Permission request failed:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Camera permission denied. Please enable camera access in your browser settings and refresh the page.');
      } else {
        setError('Failed to access camera. Please check your browser settings.');
      }
    }
  };

  const handleUpdate = (error, result) => {
    // If there's an error, check if it's a real camera/permission error
    if (error) {
      const errorText = (error?.message || error?.name || '').toLowerCase();
      // Only handle actual camera/permission errors - ignore "no barcode" type errors
      if (errorText.includes('camera') || 
          errorText.includes('permission') || 
          errorText.includes('notallowed') ||
          errorText.includes('permissiondenied') ||
          errorText.includes('not available') ||
          errorText.includes('device')) {
        // Real error - handle it
        handleError(error);
      }
      // For all other errors (including empty errors or "no barcode found"), 
      // just ignore and keep scanning - this is normal behavior
      return;
    }
    
    // Only process if we have a valid barcode result with text
    if (result && result.getText) {
      const barcodeText = result.getText();
      if (barcodeText && barcodeText.trim().length > 0) {
        // Valid barcode detected - stop scanning and process it
        setScanning(false);
        setNoBarcodeMessage(null);
        setError(null);
        onScan(barcodeText);
      }
      // If no barcode text or empty, just keep scanning silently
    }
    // If no result at all, just keep scanning (this is normal - camera is working, just no barcode yet)
  };

  const handleError = (error) => {
    console.error('Scanner error:', error);
    
    // Only handle actual camera/permission errors - these should stop scanning
    // All "no barcode found" errors should be ignored (handled in handleUpdate)
    let errorMessage = 'Failed to access camera. Please try again.';
    let isPermissionError = false;
    
    if (error?.message || error?.name) {
      const errorText = (error.message || error.name || '').toLowerCase();
      
      // Only stop scanning for real camera/permission errors
      if (errorText.includes('camera') || 
          errorText.includes('permission') || 
          errorText.includes('notallowed') ||
          errorText.includes('permissiondenied')) {
        isPermissionError = true;
        setPermissionDenied(true);
        setScanning(false);
        errorMessage = 'Camera access denied. Click "Request Permission" to try again.';
      } else if (errorText.includes('not found') || 
                 errorText.includes('not available') ||
                 errorText.includes('device')) {
        setScanning(false);
        errorMessage = 'Camera not found. Please ensure your device has a camera.';
      } else {
        // For any other error, don't stop scanning - might be a false positive
        // Just log it but keep the camera running
        console.log('Non-critical scanner error (ignoring):', error);
        return;
      }
    }
    
    setError(errorMessage);
    if (onError && !isPermissionError) {
      onError(errorMessage);
    }
  };

  const handleClose = () => {
    setScanning(false);
    setError(null);
    setTorchEnabled(false);
    // Workaround for react-webcam freeze/unmount issues and to ensure stream closes cleanly
    setStopStream(true);
    onClose();
  };

  const handleManualEntry = () => {
    // Close scanner, then open manual entry (one tick later so the dialog unmount is clean)
    handleClose();
    if (onManualAdd) {
      setTimeout(() => onManualAdd(), 0);
    }
  };

  const toggleTorch = () => {
    setTorchEnabled(!torchEnabled);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      fullScreen={window.innerWidth < 600}
      // Ensure scanner renders above the AddNewPurchase overlay (zIndex 1500)
      // and above its sub-modals (we use ~1600 there).
      sx={{ zIndex: 1700 }}
      PaperProps={{
        sx: {
          backgroundColor: '#000',
          borderRadius: { xs: 0, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
          height: { xs: '100dvh', sm: 'auto' },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          pb: 1,
        }}
      >
        <Typography variant="h6" component="div">
          Scan Barcode
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={toggleTorch}
            sx={{ color: 'white' }}
            title={torchEnabled ? 'Turn off flashlight' : 'Turn on flashlight'}
          >
            {torchEnabled ? <FlashlightOnIcon /> : <FlashlightOffIcon />}
          </IconButton>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          position: 'relative',
          flex: '1 1 auto',
          minHeight: { xs: 0, sm: 400 },
        }}
      >
        {error && (
          <Box sx={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10 }}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {noBarcodeMessage && scanning && (
          <Box sx={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10 }}>
            <Alert severity="info" onClose={() => setNoBarcodeMessage(null)}>
              {noBarcodeMessage}
            </Alert>
          </Box>
        )}

        {scanning ? (
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              minHeight: { xs: 0, sm: 400 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#000',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
              }}
            >
              <BarcodeScannerComponent
                onUpdate={handleUpdate}
                onError={handleError}
                facingMode="environment"
                torch={torchEnabled}
                // Pass through to react-webcam (the underlying <video />)
                // Some mobile browsers are picky about sizing; using explicit style is more reliable than width/height attrs.
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                stopStream={stopStream}
                videoConstraints={{
                  facingMode: { ideal: 'environment' },
                }}
              />
            </Box>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80%',
                maxWidth: '300px',
                aspectRatio: '1',
                border: '2px solid #1976d2',
                borderRadius: 2,
                pointerEvents: 'none',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                position: 'absolute',
                bottom: 40,
                color: 'white',
                textAlign: 'center',
                px: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: 1,
                py: 1,
              }}
            >
              {noBarcodeMessage || 'Position barcode within the frame'}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              backgroundColor: '#000',
              color: 'white',
            }}
          >
            <CircularProgress sx={{ color: '#1976d2', mb: 2 }} />
            <Typography>Processing barcode...</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          px: 2,
          py: 1.5,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.5)',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          Cancel
        </Button>
        {onManualAdd && (
          <Button
            onClick={handleManualEntry}
            variant="contained"
            sx={{
              backgroundColor: '#2e7d32',
              '&:hover': {
                backgroundColor: '#1b5e20',
              },
            }}
          >
            Manual Entry
          </Button>
        )}
        {permissionDenied && (
          <Button
            onClick={requestCameraPermission}
            variant="contained"
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0',
              },
            }}
          >
            Request Permission
          </Button>
        )}
        {!scanning && !permissionDenied && (
          <Button
            onClick={() => {
              setScanning(true);
              setError(null);
              setPermissionDenied(false);
              setNoBarcodeMessage(null);
            }}
            variant="contained"
            sx={{
              backgroundColor: '#1976d2',
              '&:hover': {
                backgroundColor: '#1565c0',
              },
            }}
          >
            Scan Again
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BarcodeScanner;

