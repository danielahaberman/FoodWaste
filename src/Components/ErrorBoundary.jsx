import React from 'react';
import { Box, Button, Typography, Paper, Stack } from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import HomeIcon from '@mui/icons-material/Home';
import { logError } from '../utils/errorLogger';

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
    
    // Log error to localStorage
    logError(error, {
      component: 'ErrorBoundary',
      errorInfo: errorInfo?.componentStack || null,
    });
    
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
  // Fun food tracking app error messages
  const errorMessages = [
    "There was a food fight in the server farm! 🍎",
    "The grocery scanner went on vacation! 🛒",
    "The food database had a midnight snack! 🍕",
    "The calorie counter got tired of counting! 🔢",
    "The meal planner took a lunch break! 📅",
    "The nutrition tracker went to the gym! 💪",
    "The food waste monitor fell asleep! 😴",
    "The shopping list got lost in the produce aisle! 🥬",
    "The recipe finder went foraging! 🍄",
    "The meal prep scheduler overslept! ⏰"
  ];

  const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];

  const handleGoHome = () => {
    // Clear any stored error state and navigate home
    // Use window.location instead of navigate to avoid Router context issues
    window.location.href = '/';
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
              // animation: 'bounce 2s infinite'
            }} 
          />
          
          <Typography variant="h4" component="h1" color="error" gutterBottom>
            App Glitch! 🚨
          </Typography>
          
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {randomMessage}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Don't worry, I'm working on fixing this issue!
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
            Back to Home
          </Button>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
            If this keeps happening, try refreshing the page or contact me
          </Typography>
        </Stack>
      </Paper>
      
      {/* <style>
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
      </style> */}
    </Box>
  );
}

export default ErrorBoundary;
