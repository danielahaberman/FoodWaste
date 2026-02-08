/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
  Box,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

/**
 * Mobile-friendly Select component that uses Dialog on mobile and regular Select on desktop
 */
function MobileSelect({
  value,
  onChange,
  label,
  options,
  required = false,
  error = false,
  fullWidth = true,
  size = 'small',
  ...otherProps
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dialogOpen, setDialogOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);
  const selectedLabel = selectedOption ? selectedOption.label : '';
  
  // Filter out empty placeholder options for display
  const displayOptions = options.filter(opt => opt.value !== '' || value === '');

  const handleMobileClick = () => {
    setDialogOpen(true);
  };

  const handleMobileSelect = (selectedValue) => {
    onChange({ target: { value: selectedValue } });
    setDialogOpen(false);
  };

  // Mobile: Use Dialog with List
  if (isMobile) {
    const showAsterisk = required && typeof label === 'string' && !label.includes('*');
    return (
      <>
        <FormControl fullWidth={fullWidth} size={size} required={required} error={error}>
          <Typography
            variant="caption"
            sx={{
              mb: 0.5,
              color: error ? 'error.main' : 'text.secondary',
              fontWeight: 500,
              lineHeight: 1.2,
            }}
          >
            {label}
            {showAsterisk ? ' *' : ''}
          </Typography>
          <Box
            onClick={handleMobileClick}
            role="button"
            tabIndex={0}
            aria-label={typeof label === 'string' ? label : 'Select'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleMobileClick();
              }
            }}
            sx={{
              border: error ? '1px solid #d32f2f' : '1px solid rgba(0, 0, 0, 0.23)',
              borderRadius: '4px',
              minHeight: size === 'small' ? '40px' : '56px',
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
              py: size === 'small' ? 0.75 : 1,
              cursor: 'pointer',
              backgroundColor: 'background.paper',
              '&:hover': {
                borderColor: error ? '#d32f2f' : 'rgba(0, 0, 0, 0.87)',
              },
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: 2,
              },
              '&:active': {
                borderColor: theme.palette.primary.main,
                borderWidth: '2px',
              },
            }}
          >
            <Typography
              variant={size === 'small' ? 'body2' : 'body1'}
              sx={{
                color: selectedLabel ? 'text.primary' : 'text.secondary',
                flex: 1,
              }}
            >
              {selectedLabel || 'Select…'}
            </Typography>
            <Typography sx={{ color: 'text.secondary', ml: 1 }}>▼</Typography>
          </Box>
        </FormControl>

        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          fullScreen={isMobile}
          // This component is often used inside other high z-index overlays (AddNewPurchase, etc).
          // Ensure the selection dialog always renders above the parent modal.
          sx={(theme) => ({ zIndex: theme.zIndex.modal + 500 })}
          PaperProps={{
            sx: {
              borderRadius: isMobile ? 0 : 2,
              maxHeight: isMobile ? '100%' : '80vh',
            },
          }}
        >
          <DialogTitle
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 2,
              pt: 2.5,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              {label}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <List sx={{ pt: 0 }}>
              {displayOptions.map((option) => (
                <ListItemButton
                  key={option.value || 'empty'}
                  onClick={() => handleMobileSelect(option.value)}
                  selected={value === option.value}
                  disabled={option.value === ''}
                  sx={{
                    py: 2,
                    px: 3,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    opacity: option.value === '' ? 0.6 : 1,
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected',
                      '&:hover': {
                        backgroundColor: 'action.selected',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary={option.label}
                    primaryTypographyProps={{
                      fontSize: '1rem',
                      fontWeight: value === option.value ? 500 : 400,
                    }}
                  />
                  {value === option.value && option.value !== '' && (
                    <CheckIcon sx={{ color: 'primary.main', ml: 1 }} />
                  )}
                </ListItemButton>
              ))}
            </List>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop: Use regular Select
  return (
    <FormControl fullWidth={fullWidth} size={size} required={required} error={error}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ''}
        label={label}
        onChange={onChange}
        MenuProps={{
          sx: (theme) => ({ zIndex: theme.zIndex.modal + 500 }),
          PaperProps: {
            sx: {
              maxHeight: 300,
            },
          },
        }}
        {...otherProps}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default MobileSelect;

