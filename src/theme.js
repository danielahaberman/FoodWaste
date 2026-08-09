import { createTheme } from '@mui/material/styles';
import { colors, buttonRadius, primaryAlpha, appFontFamily } from './themeColors';

export const appTheme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      dark: colors.primaryDark,
      light: colors.primaryMid,
      contrastText: '#ffffff',
    },
    success: {
      main: colors.success,
    },
    error: {
      main: colors.error,
    },
    warning: {
      main: colors.warning,
    },
    background: {
      default: colors.bg,
      paper: colors.surface,
    },
    text: {
      primary: colors.text,
      secondary: colors.textSecondary,
    },
  },
  typography: {
    htmlFontSize: 16,
    fontFamily: appFontFamily,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.bg,
          fontFamily: appFontFamily,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: buttonRadius,
          fontWeight: 600,
          boxShadow: 'none',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
          '&:active': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          backgroundColor: colors.primary,
          boxShadow: `0 2px 8px ${primaryAlpha(0.28)}`,
          '&:hover': {
            backgroundColor: colors.primaryDark,
            boxShadow: `0 4px 12px ${primaryAlpha(0.32)}`,
          },
        },
        outlined: {
          borderWidth: 2,
          backgroundColor: colors.surface,
          '&:hover': {
            borderWidth: 2,
            backgroundColor: primaryAlpha(0.04),
          },
        },
        outlinedPrimary: {
          borderColor: colors.primary,
          color: colors.primary,
          '&:hover': {
            borderColor: colors.primary,
            color: colors.primary,
          },
        },
        textPrimary: {
          color: colors.primary,
          '&:hover': {
            backgroundColor: primaryAlpha(0.04),
          },
        },
        sizeLarge: {
          minHeight: 48,
          fontSize: '1rem',
          padding: '12px 20px',
        },
        sizeMedium: {
          minHeight: 44,
          fontSize: '0.9375rem',
        },
        sizeSmall: {
          minHeight: 36,
          fontSize: '0.8125rem',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: colors.primary,
          },
          '&.Mui-selected .MuiSvgIcon-root': {
            color: colors.primary,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: colors.primary,
          color: '#ffffff',
          fontWeight: 600,
        },
        filledPrimary: {
          backgroundColor: colors.primary,
          color: '#ffffff',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        },
      },
    },
  },
});
