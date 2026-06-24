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
import { primaryAlertSx } from '../themeStyles';

const UpdatePrompt = ({ open, onUpdate, onDismiss, currentVersion, storedVersion }) => {
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
              sx={{ minWidth: 'auto', px: 2 }}
            >
              Update Now
            </Button>
            <Button color="inherit" size="small" onClick={onDismiss} sx={{ minWidth: 'auto', px: 1 }}>
              <CloseIcon fontSize="small" />
            </Button>
          </Box>
        }
        sx={{
          ...primaryAlertSx,
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
            Update from v{storedVersion} to v{currentVersion}
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default UpdatePrompt;
