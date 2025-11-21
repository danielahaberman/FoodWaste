/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Button, Box, Typography, Paper, Divider, IconButton, Tooltip } from "@mui/material";
import { GetApp as InstallIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import PWAInstallPrompt from "../PWAInstallPrompt";
import { isAuthenticated } from "../../utils/authUtils";
// import FoodEmojiBackground from "../FoodEmojiBackground";

function LandingPage() {
  const navigate = useNavigate();
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      // Check if running as PWA (standalone mode)
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone === true;
      setIsStandalone(standalone);
      
      // Check if user is authenticated and redirect to home
      if (isAuthenticated()) {
        console.log("[LandingPage] User is authenticated, redirecting to /home");
        navigate("/home");
      }
    } catch (error) {
      console.error('Error in LandingPage useEffect:', error);
      setHasError(true);
    }
  }, [navigate]);

  if (hasError) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Error loading page. Please refresh.
        </Typography>
      </Box>
    );
  }

  const handleClearStorage = () => {
    if (window.confirm('This will clear all app data (localStorage and sessionStorage). This will log you out and reset all preferences. Continue?')) {
      // Clear localStorage
      localStorage.clear();
      // Clear sessionStorage
      sessionStorage.clear();
      // Reload the page to apply changes
      window.location.reload();
    }
  };
  
  return (
    <Box sx={{
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      textAlign: "center", 
      padding: "24px",
      minHeight: "100vh",
      width: "100%",
      backgroundColor: "#f5f5f5",
      position: "relative",
      zIndex: 1,
      visibility: "visible",
      opacity: 1
    }}>
      {/* Clear Storage Button - Top Right */}
      <Tooltip title="Clear all app data (localStorage & sessionStorage)">
        <IconButton
          onClick={handleClearStorage}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            color: "#666",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            '&:hover': {
              backgroundColor: "rgba(255, 255, 255, 1)",
              color: "#1976d2"
            }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Tooltip>

      {/* Main Content */}
      <Box sx={{ 
        width: '100%', 
        height: '100%',
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            fontSize: "32px", 
            fontWeight: "bold", 
            color: "#1976d2", 
            marginBottom: "24px" 
          }}
        >
          Food Hero
        </Typography>
        
        <Paper 
          elevation={8}
          sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "24px", 
            padding: "24px", 
            borderRadius: "12px", 
            backgroundColor: "#ffffff", 
            width: "100%", 
            maxWidth: "400px",
            margin: "0 auto",
            position: "relative",
            zIndex: 2,
            visibility: "visible",
            opacity: 1
          }}
        >
          <Typography 
            variant="body1" 
            sx={{ fontSize: "18px", color: "#333333" }}
          >
            Keep track of the food you buy and minimize waste with this easy-to-use tool.
          </Typography>
          
          <Button
            variant="contained"
            sx={{ backgroundColor: "#1976d2", color: "white" }}
            onClick={() => navigate("/auth/login")}
          >
            Login
          </Button>
          
          <Button
            variant="contained"
            sx={{ backgroundColor: "#2e7d32", color: "white" }}
            onClick={() => navigate("/auth/register")}
          >
            Register
          </Button>

          {!isStandalone && (
            <>
              <Divider sx={{ my: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<InstallIcon />}
                onClick={() => setShowPWAPrompt(true)}
                sx={{
                  backgroundColor: '#1976d2',
                  color: 'white',
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#1565c0'
                  }
                }}
              >
                Install App
              </Button>
            </>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Button
              variant="text"
              sx={{ color: "#1976d2" }}
              onClick={() => navigate("/terms")}
            >
              Terms & Conditions
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt 
        open={showPWAPrompt} 
        onClose={() => setShowPWAPrompt(false)} 
      />
    </Box>
    // </FoodEmojiBackground>
  );
}

export default LandingPage;
