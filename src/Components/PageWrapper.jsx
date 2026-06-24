import React from 'react';
import {
  AppBar,
  Box,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { frostedSurface } from '../themeStyles';

export const BOTTOM_NAV_HEIGHT = 'calc(88px + env(safe-area-inset-bottom, 0px))';

/**
 * Unified page shell for app routes and public scrollable pages.
 */
const PageWrapper = ({
  title,
  children,
  headerAction,
  showLogo = false,
  logoSrc = '/appIcon2.png',
  showHeader = true,
  reserveBottomNav = true,
  backgroundColor = '#fafafa',
  contentMaxWidth = '600px',
}) => {
  const useFrostedHeader = showHeader;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: reserveBottomNav ? 0 : '100dvh',
        width: '100%',
        backgroundColor,
        overflow: 'hidden',
      }}
    >
      {showHeader && (
        <AppBar
          position="sticky"
          elevation={0}
          color="transparent"
          sx={{
            ...(useFrostedHeader ? frostedSurface : {}),
            flexShrink: 0,
          }}
        >
          <Toolbar
            sx={{
              maxWidth: contentMaxWidth,
              mx: 'auto',
              width: '100%',
              minHeight: { xs: 48, sm: 52 },
              px: { xs: 2, sm: 2.5 },
              gap: 1.5,
            }}
          >
            {showLogo && (
              <Box
                component="img"
                src={logoSrc}
                alt="Food Hero Logo"
                sx={{
                  width: { xs: 28, sm: 32 },
                  height: { xs: 28, sm: 32 },
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              />
            )}
            <Typography
              variant="h6"
              component="h1"
              sx={{
                flexGrow: 1,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                color: 'text.primary',
              }}
            >
              {title}
            </Typography>
            {headerAction}
          </Toolbar>
        </AppBar>
      )}

      <Box
        component="main"
        sx={{
          flex: 1,
          overflow: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          pb: reserveBottomNav ? BOTTOM_NAV_HEIGHT : 'calc(16px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Container
          maxWidth={false}
          disableGutters={false}
          sx={{
            maxWidth: contentMaxWidth,
            mx: 'auto',
            px: { xs: 2, sm: 2.5 },
            py: { xs: 2, sm: 2.5 },
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default PageWrapper;
