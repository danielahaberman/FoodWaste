import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      dark: '#1565c0',
    },
    success: {
      main: '#2e7d32',
    },
  },
  typography: {
    htmlFontSize: 16,
  },
  components: {
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
        },
        sizeSmall: {
          minHeight: 36,
          fontSize: '0.8125rem',
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
