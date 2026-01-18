import React from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Typography,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const UpdatePrompt = ({ open, onUpdate, onDismiss, currentVersion, storedVersion }) => {
  // Don't show if we don't have version info (backward compatibility)
  if (!open || !currentVersion || !storedVersion) {
    return null;
  }
  
  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{
        top: { xs: 16, sm: 24 },
        zIndex: 9999,
      }}
    >
      <Alert
        severity="info"
        icon={<RefreshIcon />}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              color="inherit"
              size="small"
              onClick={onUpdate}
              variant="contained"
              sx={{
                backgroundColor: '#1976d2',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
                minWidth: 'auto',
                px: 2,
              }}
            >
              Update Now
            </Button>
            <Button
              color="inherit"
              size="small"
              onClick={onDismiss}
              sx={{
                minWidth: 'auto',
                px: 1,
              }}
            >
              <CloseIcon fontSize="small" />
            </Button>
          </Box>
        }
        sx={{
          backgroundColor: '#1976d2',
          color: 'white',
          '& .MuiAlert-icon': {
            color: 'white',
          },
          '& .MuiAlert-message': {
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flex: 1,
          },
          minWidth: { xs: '90%', sm: '400px' },
          maxWidth: { xs: '90%', sm: '500px' },
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            New version available!
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            {storedVersion && currentVersion && (
              <>Update from v{storedVersion} to v{currentVersion}</>
            )}
            {!storedVersion && currentVersion && (
              <>Current version: v{currentVersion}</>
            )}
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default UpdatePrompt;

