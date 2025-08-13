import React from 'react';
import { Box, Button, Typography, Paper, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import HomeIcon from '@mui/icons-material/Home';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}

function ErrorFallback() {
  const navigate = useNavigate();
  
  // Fun food-related error messages
  const errorMessages = [
    "Oops! Looks like the kitchen caught fire! 🔥",
    "Something went wrong in the recipe! 🍳",
    "The food delivery got lost! 🚚",
    "The chef dropped the ingredients! 🥘",
    "The oven malfunctioned! 🍕",
    "The grocery list got mixed up! 🛒",
    "The food processor had a meltdown! 🥄",
    "The recipe book fell apart! 📖",
    "The kitchen timer went haywire! ⏰",
    "The food scale tipped over! ⚖️"
  ];

  const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];

  const handleGoHome = () => {
    // Clear any stored error state and navigate home
    navigate('/');
    // Optionally reload the page to clear any stuck state
    window.location.reload();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: 2
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          maxWidth: 500,
          textAlign: 'center',
          borderRadius: 3
        }}
      >
        <Stack spacing={3} alignItems="center">
          <RestaurantIcon 
            sx={{ 
              fontSize: 80, 
              color: '#ff6b6b',
              animation: 'bounce 2s infinite'
            }} 
          />
          
          <Typography variant="h4" component="h1" color="error" gutterBottom>
            Kitchen Disaster! 🚨
          </Typography>
          
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {randomMessage}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Don't worry, our chefs are working on fixing this recipe!
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': {
                backgroundColor: '#45a049'
              },
              px: 4,
              py: 1.5
            }}
          >
            Back to Kitchen
          </Button>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
            If this keeps happening, try refreshing the page or contact support
          </Typography>
        </Stack>
      </Paper>
      
      <style>
        {`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-10px);
            }
            60% {
              transform: translateY(-5px);
            }
          }
        `}
      </style>
    </Box>
  );
}

export default ErrorBoundary;
