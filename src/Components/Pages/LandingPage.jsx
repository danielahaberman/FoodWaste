/* eslint-disable no-unused-vars */
import React from "react";
import { Button, Typography, Divider, IconButton, Tooltip } from "@mui/material";
import { GetApp as InstallIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { usePWA } from "../../context/PWAContext";
import versionData from '../../../version.json';
import AuthLayout from "../AuthLayout";

function LandingPage() {
  const navigate = useNavigate();
  const { openInstallPrompt, showInstallCTA } = usePWA();

  const handleClearStorage = () => {
    if (window.confirm('This will clear all app data (localStorage and sessionStorage). This will log you out and reset all preferences. Continue?')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const clearStorageButton = (
    <Tooltip title="Clear all app data (localStorage & sessionStorage)">
      <IconButton
        onClick={handleClearStorage}
        sx={{
          position: 'absolute',
          top: { xs: 'calc(16px + env(safe-area-inset-top, 0px))', sm: 16 },
          right: { xs: 16, sm: 16 },
          color: 'text.secondary',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
        }}
      >
        <RefreshIcon />
      </IconButton>
    </Tooltip>
  );

  return (
    <AuthLayout
      title="Food Hero"
      topAction={clearStorageButton}
      footer={
        <Typography variant="caption" color="text.secondary" sx={{ mt: 3 }}>
          Version {versionData.version}
        </Typography>
      }
    >
      <Typography variant="body1" color="text.primary">
        Keep track of the food you buy and minimize waste with this easy-to-use tool.
      </Typography>

      <Button variant="contained" color="primary" fullWidth onClick={() => navigate("/auth/login")}>
        Login
      </Button>

      <Button variant="contained" color="success" fullWidth onClick={() => navigate("/auth/register")}>
        Register
      </Button>

      {showInstallCTA && (
        <>
          <Divider>
            <Typography variant="body2" color="text.secondary">OR</Typography>
          </Divider>
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            startIcon={<InstallIcon />}
            onClick={openInstallPrompt}
          >
            Install App
          </Button>
        </>
      )}

      <Button variant="text" color="primary" fullWidth onClick={() => navigate("/terms")}>
        Terms & Conditions
      </Button>
    </AuthLayout>
  );
}

export default LandingPage;
