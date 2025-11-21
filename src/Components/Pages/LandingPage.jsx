/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Button, Box, Typography, Paper, Divider } from "@mui/material";
import { GetApp as InstallIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import PWAInstallPrompt from "../PWAInstallPrompt";
// import FoodEmojiBackground from "../FoodEmojiBackground";

function LandingPage() {
  const navigate = useNavigate();
  const [showPWAPrompt, setShowPWAPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as PWA (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone === true;
    setIsStandalone(standalone);
  }, []);
  
  return (
    // <FoodEmojiBackground
    //   sx={{
    //     display: "flex", 
    //     flexDirection: "column", 
    //     alignItems: "center", 
    //     justifyContent: "center", 
    //     textAlign: "center", 
    //     padding: "24px"
    //   }}
    // >
    <Box sx={{
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      textAlign: "center", 
      padding: "24px",
      minHeight: "100vh",
      backgroundColor: "#f5f5f5"
    }}>
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
            backgroundColor: "rgba(255, 255, 255, 0.95)", 
            backdropFilter: "blur(10px)",
            width: "100%", 
            maxWidth: "400px",
            margin: "0 auto"
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
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button
              variant="text"
              sx={{ color: "#1976d2" }}
              onClick={() => navigate("/terms")}
            >
              Terms & Conditions
            </Button>
            <Button
              variant="text"
              sx={{ color: "#6b7280" }}
              onClick={() => navigate("/privacy")}
            >
              Privacy
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
