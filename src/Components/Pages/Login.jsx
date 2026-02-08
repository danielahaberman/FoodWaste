// @ts-nocheck
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Alert,
  Container,
  Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { setAuthenticated, getIntendedDestination, clearIntendedDestination, getUsername, saveUsername, isAuthenticated, getLastRoute } from "../../utils/authUtils";
import { authAPI } from "../../api";
// import FoodEmojiBackground from "../FoodEmojiBackground";

function LoginPage() {
  const [email, setEmail] = useState(getUsername());
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      const lastRoute = getLastRoute();
      navigate(lastRoute, { replace: true });
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await authAPI.login({
        username: email,
        password,
      });
      
      // Save username for auto-fill next time
      saveUsername(email);
      // Set authentication first
      setAuthenticated(response.data.user_id, email);
      
      // Check if there's a stored intended destination
      const intendedDestination = getIntendedDestination();
      if (intendedDestination) {
        clearIntendedDestination();
        navigate(intendedDestination);
      } else {
        navigate("/log");
      }
      // TermsGuard will handle showing terms if not accepted
    } catch (err) {
      console.error("Login error:", err);
      // Provide more specific error messages
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const responseData = err.response.data || {};
        const serverMessage = responseData.error || responseData.message;
        
        if (status === 401) {
          setError(serverMessage || "Invalid username or password");
        } else if (status === 404) {
          setError(serverMessage || "User not found");
        } else if (status === 400) {
          setError(serverMessage || "Please fill in all fields");
        } else {
          setError(serverMessage || "Server error. Please try again.");
        }
      } else if (err.request) {
        // Request was made but no response received
        setError("Network error. Please check your connection and try again.");
      } else {
        // Something else happened
        setError(err.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    // <FoodEmojiBackground>
      <Container 
        maxWidth="sm" 
        sx={{ 
          minHeight: '100vh',
          height: '100vh',
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
          paddingTop: { xs: 4, sm: 4 },
          paddingBottom: { xs: 4, sm: 4 },
          paddingLeft: { xs: 2, sm: 2 },
          paddingRight: { xs: 2, sm: 2 },
          boxSizing: 'border-box'
        }}
      >
        {/* Logo */}
        <Box
          component="img"
          src="/appIcon2.png"
          alt="Food Hero Logo"
          sx={{
            width: { xs: 100, sm: 120 },
            height: { xs: 100, sm: 120 },
            mb: 3,
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        />
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold', 
            color: '#1976d2', 
            mb: 4,
            textAlign: 'center'
          }}
        >
          Login
        </Typography>

        <Paper 
          elevation={8}
          sx={{ 
            width: '100%', 
            maxWidth: 400,
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Card sx={{ backgroundColor: 'transparent' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Username"
                  variant="outlined"
                  placeholder="Enter your username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1
                    }
                  }}
                />
                
                <TextField
                  type="password"
                  label="Password"
                  variant="outlined"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1
                    }
                  }}
                />

                {error && (
                  <Alert severity="error" sx={{ borderRadius: 1 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  onClick={handleLogin}
                  disabled={loading}
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    backgroundColor: '#1976d2',
                    borderRadius: 1,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: '#1565c0'
                    },
                    '&:disabled': {
                      backgroundColor: '#ccc'
                    }
                  }}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>

                <Button
                  onClick={() => navigate("/")}
                  variant="text"
                  fullWidth
                  sx={{
                    color: '#1976d2',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)'
                    }
                  }}
                >
                  Back to Landing
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Paper>
      </Container>
    // </FoodEmojiBackground>
  );
}

export default LoginPage;
