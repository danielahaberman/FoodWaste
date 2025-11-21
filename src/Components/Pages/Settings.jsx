// @ts-nocheck
import React from 'react';
import { Box, Button, Typography, Container, Paper, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../utils/authUtils';
import PageWrapper from '../PageWrapper';
import {
  Logout as LogoutIcon,
  MenuBook as ResourcesIcon
} from '@mui/icons-material';

const Settings = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleResources = () => {
    navigate('/resources');
  };

  return (
    <PageWrapper 
      title="Settings" 
      maxWidth="sm"
    >
      <Container 
        maxWidth="sm"
        sx={{ 
          maxWidth: { xs: '100%', sm: '600px' },
          px: { xs: 2, sm: 2.5 },
          py: { xs: 2.5, sm: 3 },
          pb: 0 // PageWrapper handles bottom padding for nav bar
        }}
      >
        <Paper 
          elevation={0}
          sx={{ 
            mb: 2,
            borderRadius: 4,
            border: 'none',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
            backgroundColor: 'white',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ResourcesIcon />}
              onClick={handleResources}
              sx={{
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              Food Waste Resources
            </Button>

            <Divider sx={{ my: 2 }} />

            <Button
              fullWidth
              variant="contained"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                backgroundColor: '#d32f2f',
                '&:hover': {
                  backgroundColor: '#c62828'
                }
              }}
            >
              Logout
            </Button>
          </Box>
        </Paper>
      </Container>
    </PageWrapper>
  );
};

export default Settings;

