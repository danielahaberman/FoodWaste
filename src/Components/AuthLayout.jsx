import React from 'react';
import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

/**
 * Centered auth/marketing layout for landing, login, and register pages.
 */
const AuthLayout = ({ title, children, topAction, footer }) => {
  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 4,
        px: 2,
        boxSizing: 'border-box',
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      {topAction}

      <Box
        component="img"
        src="/appIcon2.png"
        alt="Food Hero Logo"
        sx={{
          width: { xs: 100, sm: 120 },
          height: { xs: 100, sm: 120 },
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      />

      {title && (
        <Typography
          variant="h3"
          component="h1"
          color="primary"
          sx={{
            fontWeight: 'bold',
            mb: 3,
            textAlign: 'center',
            fontSize: { xs: '1.75rem', sm: '2rem' },
          }}
        >
          {title}
        </Typography>
      )}

      <Paper
        elevation={8}
        sx={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 2,
          p: { xs: 3, sm: 4 },
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Stack spacing={3}>{children}</Stack>
      </Paper>

      {footer}
    </Container>
  );
};

export default AuthLayout;
