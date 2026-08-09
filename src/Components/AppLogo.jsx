import React from 'react';
import { Box } from '@mui/material';
import { primaryAlpha } from '../themeColors';

export const APP_LOGO_SRC = '/pwa-512.png';

function AppLogo({
  size = 96,
  borderRadius = 4,
  shadow = true,
  src = APP_LOGO_SRC,
  alt = 'Food Hero logo',
  sx,
  imageSx,
}) {
  const dimension = typeof size === 'number' ? { xs: size, sm: size } : size;

  return (
    <Box
      sx={{
        width: dimension,
        height: dimension,
        borderRadius,
        bgcolor: '#fff',
        boxShadow: shadow ? `0 8px 24px ${primaryAlpha(0.25)}` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        ...sx,
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          ...imageSx,
        }}
      />
    </Box>
  );
}

export default AppLogo;
