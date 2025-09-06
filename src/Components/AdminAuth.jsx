import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper
} from '@mui/material';
import { Lock, AdminPanelSettings, Home } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AdminAuth = ({ onLogin }) => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Hardcoded admin credentials
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'Admin_Food_Waste';

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (credentials.username === ADMIN_USERNAME && credentials.password === ADMIN_PASSWORD) {
      onLogin();
    } else {
      setError('Invalid username or password');
    }

    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <AdminPanelSettings 
            sx={{ 
              fontSize: 48, 
              color: 'primary.main', 
              mb: 2 
            }} 
          />
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Access
          </Typography>
          <Typography variant="body2" color="textSecondary" textAlign="center">
            Enter your admin credentials to access the dashboard
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={credentials.username}
                onChange={handleInputChange}
                margin="normal"
                required
                autoComplete="username"
                autoFocus
                InputProps={{
                  startAdornment: <AdminPanelSettings sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
              
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleInputChange}
                margin="normal"
                required
                autoComplete="current-password"
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Box mt={3} textAlign="center">
          <Button
            variant="outlined"
            startIcon={<Home />}
            onClick={() => navigate('/')}
            sx={{ mb: 2 }}
          >
            Go to User Login
          </Button>
          <Typography variant="body2" color="textSecondary">
            This is a restricted area for administrators only
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminAuth;
