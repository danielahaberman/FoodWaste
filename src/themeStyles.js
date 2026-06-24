/** Shared frosted-glass surface styles used by headers, nav, and cards. */
export const frostedSurface = {
  backgroundColor: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(40px) saturate(200%)',
  WebkitBackdropFilter: 'blur(40px) saturate(200%)',
  borderBottom: '0.5px solid rgba(0, 0, 0, 0.06)',
};

export const frostedBar = {
  backdropFilter: 'blur(40px) saturate(200%)',
  WebkitBackdropFilter: 'blur(40px) saturate(200%)',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderTop: '1px solid rgba(0, 0, 0, 0.08)',
  boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08), 0 -2px 6px rgba(0, 0, 0, 0.06)',
};

export const primaryAlertSx = {
  backgroundColor: 'primary.main',
  color: 'primary.contrastText',
  '& .MuiAlert-icon': { color: 'primary.contrastText' },
};
