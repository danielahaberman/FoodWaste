import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated, setIntendedDestination } from "../utils/authUtils";

function AuthGuard({ children }) {
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    let loadingState = true;
    
    const checkAuth = async () => {
      try {
        // Check if user is logged in (this will also check expiration)
        const authenticated = isAuthenticated();
        if (isMounted) {
          setIsUserAuthenticated(authenticated);
          setIsLoading(false);
          loadingState = false;
        }
      } catch (error) {
        console.error('AuthGuard error:', error);
        if (isMounted) {
          setIsUserAuthenticated(false);
          setIsLoading(false);
          loadingState = false;
        }
      }
    };
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isMounted && loadingState) {
        console.warn('AuthGuard: Loading timeout, defaulting to unauthenticated');
        setIsUserAuthenticated(false);
        setIsLoading(false);
        loadingState = false;
      }
    }, 2000);
    
    checkAuth();
    
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [location.pathname]); // Re-check on route changes

  // If still loading, show nothing (but with timeout protection)
  if (isLoading) {
    return null;
  }

  // Define public pages that don't require authentication
  const publicPages = ["/", "/auth/login", "/auth/register", "/terms"];
  
  // If not authenticated and trying to access protected pages, redirect to login
  if (!isUserAuthenticated && !publicPages.includes(location.pathname)) {
    // Store the intended destination for after login
    setIntendedDestination(location.pathname);
    navigate("/auth/login");
    return null;
  }

  // If authenticated, render the children (normal app content)
  return children;
}

export default AuthGuard;
