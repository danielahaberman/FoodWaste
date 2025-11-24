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

  // Define public pages that don't require authentication
  const publicPages = ["/", "/auth/login", "/auth/register", "/terms"];
  
  // If still loading, show nothing for public pages, but allow them through
  // This prevents white screens on public pages during auth check
  if (isLoading) {
    // If it's a public page, render children immediately (don't wait for auth check)
    if (publicPages.includes(location.pathname)) {
      return children;
    }
    // For protected pages, return null (will show white screen briefly, but timeout will handle it)
    return null;
  }

  // If not authenticated (or auth check failed/errored) and trying to access protected pages, redirect to login
  // This handles: failed auth check, errors during check, and timeout scenarios
  if (!isUserAuthenticated && !publicPages.includes(location.pathname)) {
    // Store the intended destination so user can return after login
    setIntendedDestination(location.pathname);
    // Redirect to login page (replace: true prevents back button issues)
    navigate("/auth/login", { replace: true });
    return null;
  }

  // If authenticated, render the children (normal app content)
  return children;
}

export default AuthGuard;
