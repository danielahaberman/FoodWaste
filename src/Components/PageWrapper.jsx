// @ts-nocheck
import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Unified wrapper component for pages with bottom navigation
 * Provides consistent header with title (no close button - navigate via bottom nav)
 */
const PageWrapper = ({ 
  title, 
  children, 
  maxWidth = 'sm',
  headerColor = 'background.default',
  headerTextColor = 'text.primary',
  headerAction
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
      pointerEvents: 'none', // Allow clicks to pass through to BottomBar
    }}>
      {/* Header */}
      <Box sx={{
        pointerEvents: 'auto', // Re-enable pointer events for header 
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
        display: 'flex',
        justifyContent: 'center',
        paddingTop: { xs: 1, sm: 1.25 },
        paddingBottom: { xs: 1, sm: 1.25 },
        paddingLeft: { xs: 2, sm: 2.5 },
        paddingRight: { xs: 2, sm: 2.5 }
      }}>
        <Box
          sx={{ 
            width: '100%',
            maxWidth: '600px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            minHeight: { xs: 40, sm: 44 }
          }}
        >
          <Typography 
            variant="h5" 
            component="h1" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              fontWeight: 600,
              letterSpacing: '-0.01em',
              lineHeight: 1.3,
              color: headerColor === 'white' || headerColor === 'background.default'
                ? 'rgba(0, 0, 0, 0.9)'
                : headerTextColor
            }}
          >
            {title}
          </Typography>
          {headerAction && (
            <Box sx={{ ml: 'auto' }}>
              {headerAction}
            </Box>
          )}
        </Box>
      </Box>

      {/* Scrollable Content Area */}
      <Box 
        sx={{ 
          flex: 1,
          overflow: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          pt: { xs: 2, sm: 2.5 }, // Padding after header
          px: { xs: 2, sm: 2.5 }, // Left and right padding for content
          pb: '88px', // Space for bottom nav bar
          pointerEvents: 'auto' // Re-enable pointer events for content
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default PageWrapper;

