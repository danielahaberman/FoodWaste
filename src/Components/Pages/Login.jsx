// @ts-nocheck
/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import PageLayout from "../PageLayout";
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
import { setAuthenticated, getIntendedDestination, clearIntendedDestination } from "../../utils/authUtils";
import { authAPI } from "../../api";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      
      console.log("response", response);
      setAuthenticated(response.data.user_id);
      
      // Check if terms have been accepted
      try {
        const termsResponse = await authAPI.getTermsStatus(response.data.user_id);
        if (!termsResponse.data.termsAccepted) {
          navigate("/terms");
        } else {
          // Check if there's a stored intended destination
          const intendedDestination = getIntendedDestination();
          if (intendedDestination) {
            clearIntendedDestination();
            navigate(intendedDestination);
          } else {
            navigate("/home");
          }
        }
      } catch (error) {
        console.error("Error checking terms status:", error);
        // If we can't check terms status, proceed to home
        navigate("/home");
      }
    } catch (err) {
      setError("Invalid credentials or server error");
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
    <PageLayout backgroundColor="#f5f5f5">
      <Container 
        maxWidth="sm" 
        sx={{ 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          alignItems: 'center',
          py: 4
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
          Login
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
    </PageLayout>
  );
}

export default LoginPage;
