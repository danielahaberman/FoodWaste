/* eslint-disable react/prop-types */
import React from "react";
import {
  Dialog,
  Typography,
  Box,
  Stack,
  Button,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const toneStyles = {
  default: {
    iconBg: "rgba(25, 118, 210, 0.12)",
    iconColor: "primary.main",
  },
  warning: {
    iconBg: "rgba(237, 108, 0, 0.12)",
    iconColor: "warning.dark",
  },
  success: {
    iconBg: "rgba(46, 125, 50, 0.12)",
    iconColor: "success.dark",
  },
  primary: {
    iconBg: "rgba(25, 118, 210, 0.12)",
    iconColor: "primary.main",
  },
};

/** Shared MUI Dialog sx — bottom sheet on mobile, centered card on desktop. */
export function getAppDialogSx({
  zIndex,
  maxWidth = "xs",
  scrollable = false,
  presentation = "sheet",
} = {}) {
  const paperMaxWidth = maxWidth === "sm" ? 480 : 420;
  const centered = presentation === "centered";

  return {
    ...(zIndex != null && { zIndex }),
    "& .MuiDialog-container": {
      alignItems: centered ? "center" : { xs: "flex-end", sm: "center" },
      justifyContent: "center",
    },
    "& .MuiBackdrop-root": {
      backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    "& .MuiDialog-paper": {
      margin: centered ? 2 : { xs: 0, sm: 2 },
      width: "100%",
      maxWidth: paperMaxWidth,
      borderRadius: centered ? 3 : { xs: "20px 20px 0 0", sm: 3 },
      overflow: "hidden",
      maxHeight: centered ? "90vh" : { xs: "88vh", sm: "90vh" },
      ...(scrollable && {
        display: "flex",
        flexDirection: "column",
      }),
    },
  };
}

/**
 * Compact confirmation / alert dialog.
 * On mobile: bottom sheet (never fullScreen). On desktop: centered card.
 */
export default function AppConfirmDialog({
  open,
  onClose,
  title,
  tone = "default",
  icon = null,
  children,
  primaryAction,
  secondaryAction,
  extraActions = null,
  zIndex,
  disableEscapeKeyDown = false,
  hideCloseButton = false,
  maxWidth = "xs",
  scrollable = false,
  presentation = "sheet",
}) {
  const styles = toneStyles[tone] || toneStyles.default;

  const handleClose = (_, reason) => {
    if (reason === "backdropClick" && disableEscapeKeyDown) return;
    onClose?.();
  };

  const actionButtonSx = {
    minHeight: 44,
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 600,
    py: 1.25,
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth
      scroll={scrollable ? "paper" : "body"}
      disableEscapeKeyDown={disableEscapeKeyDown}
      sx={getAppDialogSx({ zIndex, maxWidth, scrollable, presentation })}
    >
      <Box sx={{ px: 2.5, pt: 2.5, pb: 0, flexShrink: 0 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          {icon && (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: styles.iconBg,
                color: styles.iconColor,
                "& .MuiSvgIcon-root": { fontSize: 26 },
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ flex: 1, minWidth: 0, pt: icon ? 0.25 : 0 }}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={1}
            >
              <Typography
                variant="subtitle1"
                component="h2"
                sx={{ fontWeight: 700, lineHeight: 1.35, pr: hideCloseButton ? 0 : 1 }}
              >
                {title}
              </Typography>
              {!hideCloseButton && onClose && (
                <IconButton
                  size="small"
                  aria-label="Close"
                  onClick={onClose}
                  sx={{ mt: -0.5, mr: -0.5, flexShrink: 0 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>

      {children && (
        <Box
          sx={{
            px: 2.5,
            pt: 1.5,
            pb: 0.5,
            ...(scrollable && {
              overflowY: "auto",
              flex: 1,
              minHeight: 0,
            }),
          }}
        >
          {typeof children === "string" ? (
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
              {children}
            </Typography>
          ) : (
            children
          )}
        </Box>
      )}

      {(primaryAction || secondaryAction || extraActions) && (
        <Stack
          spacing={1.25}
          sx={{
            px: 2.5,
            pt: 2,
            pb: "calc(20px + env(safe-area-inset-bottom, 0px))",
            flexShrink: 0,
          }}
        >
          {primaryAction && (
            <Button
              variant={primaryAction.variant || "contained"}
              color={primaryAction.color || "primary"}
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              fullWidth
              sx={actionButtonSx}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || "outlined"}
              color={secondaryAction.color || "primary"}
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              fullWidth
              sx={actionButtonSx}
            >
              {secondaryAction.label}
            </Button>
          )}
          {extraActions}
        </Stack>
      )}
    </Dialog>
  );
}
