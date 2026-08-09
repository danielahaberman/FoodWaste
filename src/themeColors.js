/** Single source of truth for the Food Hero orange/cream palette. */
export const colors = {
  primary: '#f97316',
  primaryDark: '#ea580c',
  primaryMid: '#fb923c',
  primaryLight: '#fff7ed',
  primaryMuted: '#fed7aa',

  bg: '#FFF9F2',
  surface: '#FFFFFF',
  muted: '#F5EDE4',

  success: '#2E7D32',
  error: '#D32F2F',
  warning: '#f97316',

  text: '#3D3028',
  textSecondary: '#6B5D52',

  brandTitle: '#f97316',
};

export const appFontFamily = '"Lexend Deca", sans-serif';
export const brandFontFamily = appFontFamily;

export const buttonRadius = 10;

export const primaryAlpha = (opacity) => `rgba(249, 115, 22, ${opacity})`;

export const primaryGradient = `linear-gradient(135deg, ${colors.primaryDark} 0%, ${colors.primaryMid} 100%)`;
export const primaryGradientH = `linear-gradient(90deg, ${colors.primary}, ${colors.primaryMid})`;
