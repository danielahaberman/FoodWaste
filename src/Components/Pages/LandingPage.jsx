/* eslint-disable no-unused-vars */
import React from "react";
import {
  Box,
  Button,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  Paper,
} from "@mui/material";
import {
  GetApp as InstallIcon,
  Refresh as RefreshIcon,
  Restaurant as FoodIcon,
  EnergySavingsLeaf as EcoIcon,
  EmojiEvents as StreakIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { usePWA } from "../../context/PWAContext";
import versionData from '../../../version.json';

import { colors, primaryAlpha } from "../../themeColors";
import AppLogo from "../AppLogo";

const FEATURES = [
  {
    icon: FoodIcon,
    title: "Log purchases",
    description: "Track what you buy, when, and how much it cost.",
    color: colors.primary,
    bg: primaryAlpha(0.1),
  },
  {
    icon: EcoIcon,
    title: "Reduce waste",
    description: "Record what you eat and what gets thrown away.",
    color: "#2e7d32",
    bg: "rgba(46, 125, 50, 0.1)",
  },
  {
    icon: StreakIcon,
    title: "Stay motivated",
    description: "Complete daily tasks, build streaks, and climb the leaderboard.",
    color: colors.primary,
    bg: primaryAlpha(0.1),
  },
];

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

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowY: 'auto',
        background: colors.bg,
      }}
    >
      {/* Decorative background shapes */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: -60,
          right: -40,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${primaryAlpha(0.15)} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          bottom: 80,
          left: -50,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(46, 125, 50, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Tooltip title="Clear all app data (localStorage & sessionStorage)">
        <IconButton
          onClick={handleClearStorage}
          aria-label="Clear app data"
          sx={{
            position: 'absolute',
            top: { xs: 'calc(12px + env(safe-area-inset-top, 0px))', sm: 16 },
            right: 16,
            zIndex: 1,
            color: 'text.secondary',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Tooltip>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 2.5,
          py: { xs: 4, sm: 5 },
          pb: { xs: 3, sm: 4 },
        }}
      >
        {/* Hero */}
        <Stack alignItems="center" spacing={1.5} sx={{ mb: 4, mt: { xs: 2, sm: 0 } }}>
          <AppLogo size={{ xs: 96, sm: 112 }} borderRadius={4} />
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2.25rem', sm: '2.75rem' },
              letterSpacing: '-0.02em',
              color: colors.brandTitle,
              textAlign: 'center',
            }}
          >
            Food Hero
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              textAlign: 'center',
              maxWidth: 320,
              lineHeight: 1.6,
              fontSize: { xs: '0.95rem', sm: '1rem' },
            }}
          >
            Track what you buy, cut down on waste, and build better habits — one meal at a time.
          </Typography>
        </Stack>

        {/* Features */}
        <Stack spacing={2} sx={{ width: '100%', maxWidth: 440, mb: 3 }}>
          {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
            <Paper
              key={title}
              elevation={0}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                p: { xs: 2.25, sm: 2.5 },
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
              }}
            >
              <Box
                sx={{
                  flexShrink: 0,
                  width: { xs: 52, sm: 56 },
                  height: { xs: 52, sm: 56 },
                  borderRadius: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: bg,
                  color,
                }}
              >
                <Icon sx={{ fontSize: { xs: 28, sm: 30 } }} />
              </Box>
              <Box sx={{ minWidth: 0, pt: 0.25 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  lineHeight={1.35}
                  sx={{ fontSize: { xs: '1.05rem', sm: '1.125rem' }, mb: 0.5 }}
                >
                  {title}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  lineHeight={1.5}
                  sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}
                >
                  {description}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Stack>

        {/* CTAs */}
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 400,
            p: 2.5,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.95)',
          }}
        >
          <Stack spacing={1.5}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={<LoginIcon />}
              onClick={() => navigate("/auth/login")}
            >
              Log in
            </Button>

            <Button
              variant="outlined"
              color="primary"
              size="large"
              fullWidth
              startIcon={<RegisterIcon />}
              onClick={() => navigate("/auth/register")}
            >
              Create account
            </Button>

            {showInstallCTA && (
              <>
                <Divider sx={{ my: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    or
                  </Typography>
                </Divider>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  startIcon={<InstallIcon />}
                  onClick={openInstallPrompt}
                      sx={{ py: 1.25 }}
                >
                  Install app
                </Button>
              </>
            )}
          </Stack>
        </Paper>

        <Button
          variant="text"
          color="primary"
          size="small"
          onClick={() => navigate("/terms")}
          sx={{ mt: 2.5, textTransform: 'none', fontWeight: 500 }}
        >
          Terms & Conditions
        </Button>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          textAlign: 'center',
          pb: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          opacity: 0.7,
        }}
      >
        Version {versionData.version}
      </Typography>
    </Box>
  );
}

export default LandingPage;
