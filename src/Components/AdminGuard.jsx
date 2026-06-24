import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import AdminAuth from './AdminAuth';
import AdminDashboard from './Pages/AdminDashboard';
import { isAdminAuthenticated, setAdminAuthenticated, clearAdminAuth } from '../utils/authUtils';

const AdminGuard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsAuthenticated(isAdminAuthenticated());
    setIsLoading(false);
  }, []);

  const handleLogin = (token) => {
    setAdminAuthenticated(token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearAdminAuth();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <AdminAuth onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
};

export default AdminGuard;
