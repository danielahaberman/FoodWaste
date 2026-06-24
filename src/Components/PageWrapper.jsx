import React from 'react';
import {
  Box,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import { frostedSurface } from '../themeStyles';

/** Height of the bottom tab bar — used for snackbars/overlays, not page scroll padding. */
export const BOTTOM_NAV_HEIGHT = 'calc(88px + env(safe-area-inset-bottom, 0px))';

/**
 * Unified page shell: fixed header (+ optional subheader), single scroll region, bottom nav lives in SidebarLayout.
 */
const PageWrapper = ({
  title,
  children,
  headerAction,
  subHeader = null,
  showLogo = false,
  logoSrc = '/appIcon2.png',
  showHeader = true,
  reserveBottomNav = true,
  backgroundColor = '#fafafa',
  contentMaxWidth = '600px',
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        height: '100%',
        minHeight: 0,
        width: '100%',
        backgroundColor,
        overflow: 'hidden',
      }}
    >
      {showHeader && (
        <Box
          component="header"
          sx={{
            ...frostedSurface,
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{
              maxWidth: contentMaxWidth,
              mx: 'auto',
              width: '100%',
              minHeight: { xs: 48, sm: 52 },
              px: { xs: 2, sm: 2.5 },
              py: { xs: 0.75, sm: 1 },
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
                minWidth: 0,
              }}
              noWrap
            >
              {title}
            </Typography>
            {headerAction}
          </Stack>
        </Box>
      )}

      {subHeader && (
        <Box
          sx={{
            flexShrink: 0,
            zIndex: 9,
            backgroundColor,
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          }}
        >
          <Box
            sx={{
              maxWidth: contentMaxWidth,
              mx: 'auto',
              width: '100%',
              px: { xs: 2, sm: 2.5 },
            }}
          >
            {subHeader}
          </Box>
        </Box>
      )}

      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
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
            pb: reserveBottomNav
              ? { xs: 2, sm: 2.5 }
              : 'calc(16px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default PageWrapper;
