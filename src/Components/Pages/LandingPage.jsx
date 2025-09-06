/* eslint-disable no-unused-vars */
import React from "react";
import { Button, Box, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import FoodEmojiBackground from "../FoodEmojiBackground";

function LandingPage() {
  const navigate = useNavigate();
  return (
    <FoodEmojiBackground
      sx={{
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        textAlign: "center", 
        padding: "24px"
      }}
    >
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
          Manage Your Food Waste
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
    </FoodEmojiBackground>
  );
}

export default LandingPage;
