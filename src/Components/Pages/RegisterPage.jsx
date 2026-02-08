// @ts-nocheck
/* eslint-disable no-unused-vars */
import React, { useState } from "react";
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
import { authAPI } from "../../api";
import { saveUsername } from "../../utils/authUtils";
// import FoodEmojiBackground from "../FoodEmojiBackground";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleRegister = async () => {
    if (!username || !password || !confirmPassword || !name) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await authAPI.register({ username, password, name });
      // Save username for auto-fill on login page
      saveUsername(username);
      navigate("/auth/login");
    } catch (err) {
      console.error("Registration error:", err);
      if (err.response) {
        const status = err.response.status;
        const responseData = err.response.data || {};
        const serverMessage = responseData.error || responseData.message;

        if (status === 409) {
          setError(serverMessage || "That username is already taken.");
        } else if (status === 400) {
          setError(serverMessage || "Please fill in all fields.");
        } else {
          setError(serverMessage || "Registration failed. Please try again.");
        }
      } else if (err.request) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleRegister();
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
          Register
        </Typography>

        <Paper 
          elevation={3}
          sx={{ 
            width: '100%', 
            maxWidth: 400,
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Card sx={{ backgroundColor: 'white' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Full Name"
                  variant="outlined"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1
                    }
                  }}
                />

                <TextField
                  label="Username"
                  variant="outlined"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                  placeholder="Create a password"
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

                <TextField
                  type="password"
                  label="Confirm Password"
                  variant="outlined"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  onClick={handleRegister}
                  disabled={loading || !username || !password || !confirmPassword || !name}
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    backgroundColor: '#2e7d32',
                    borderRadius: 1,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: '#1b5e20'
                    },
                    '&:disabled': {
                      backgroundColor: '#ccc'
                    }
                  }}
                >
                  {loading ? 'Creating Account...' : 'Register'}
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

export default RegisterPage;
