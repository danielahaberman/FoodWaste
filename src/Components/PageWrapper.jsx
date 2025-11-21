// @ts-nocheck
import React from 'react';
import { Box, Typography, IconButton, Container } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

/**
 * Unified wrapper component for pages with bottom navigation
 * Provides consistent header with title and close button
 */
const PageWrapper = ({ 
  title, 
  onClose, 
  children, 
  maxWidth = 'sm',
  headerColor = 'primary.main',
  headerTextColor = 'white'
}) => {
  return (
    <Box sx={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#fafafa', // Cleaner Apple-like background
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 1300,
      /* iOS safe area support */
      paddingTop: 'env(safe-area-inset-top, 0)',
      paddingBottom: 'env(safe-area-inset-bottom, 0)',
      paddingLeft: 'env(safe-area-inset-left, 0)',
      paddingRight: 'env(safe-area-inset-right, 0)',
    }}>
      {/* Header */}
      <Box sx={{ 
        backgroundColor: headerColor === 'white' || headerColor === 'background.default' 
          ? 'rgba(255, 255, 255, 0.85)' 
          : headerColor, 
        color: headerTextColor, 
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        flexShrink: 0,
        borderBottom: headerColor === 'white' || headerColor === 'background.default' 
          ? '0.5px solid rgba(0, 0, 0, 0.06)' 
          : 'none',
        backdropFilter: headerColor === 'white' || headerColor === 'background.default' 
          ? 'blur(40px) saturate(200%)' 
          : 'none',
        WebkitBackdropFilter: headerColor === 'white' || headerColor === 'background.default' 
          ? 'blur(40px) saturate(200%)' 
          : 'none',
        /* iOS safe area support for header */
        paddingTop: { xs: `calc(20px + env(safe-area-inset-top, 0))`, sm: `calc(24px + env(safe-area-inset-top, 0))` },
        paddingBottom: { xs: 2.5, sm: 3 },
        paddingLeft: `calc(0px + env(safe-area-inset-left, 0))`,
        paddingRight: `calc(0px + env(safe-area-inset-right, 0))`,
        marginTop: { xs: `calc(env(safe-area-inset-top, 0) * -1)`, sm: `calc(env(safe-area-inset-top, 0) * -1)` }
      }}>
        <Container 
          maxWidth={maxWidth}
          sx={{ 
            px: { xs: 3.5, sm: 4.5 },
            maxWidth: { xs: '100%', sm: maxWidth === 'sm' ? '600px' : '900px' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2.5,
            minHeight: { xs: 60, sm: 68 }
          }}
        >
          <Typography 
            variant="h5" 
            component="h1" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1.35rem', sm: '1.65rem' },
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: headerColor === 'white' || headerColor === 'background.default'
                ? 'rgba(0, 0, 0, 0.9)'
                : headerTextColor
            }}
          >
            {title}
          </Typography>
          {onClose && (
            <IconButton
              color="inherit"
              onClick={onClose}
              aria-label="close"
              sx={{ 
                minWidth: 40,
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: '50%',
                backgroundColor: headerColor === 'white' || headerColor === 'background.default'
                  ? 'rgba(0, 0, 0, 0.04)'
                  : 'rgba(255, 255, 255, 0.15)',
                color: headerColor === 'white' || headerColor === 'background.default'
                  ? 'rgba(0, 0, 0, 0.7)'
                  : headerTextColor,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: headerColor === 'white' || headerColor === 'background.default'
                    ? 'rgba(0, 0, 0, 0.08)'
                    : 'rgba(255, 255, 255, 0.25)',
                  transform: 'scale(1.08)',
                  color: headerColor === 'white' || headerColor === 'background.default'
                    ? 'rgba(0, 0, 0, 0.9)'
                    : headerTextColor
                },
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
            >
              <CloseIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.4rem' } }} />
            </IconButton>
          )}
        </Container>
      </Box>

      {/* Scrollable Content Area */}
      <Box 
        sx={{ 
          flex: 1,
          overflow: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default PageWrapper;

