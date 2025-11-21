import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated, setIntendedDestination } from "../utils/authUtils";

function AuthGuard({ children }) {
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in (this will also check expiration)
    const authenticated = isAuthenticated();
    setIsUserAuthenticated(authenticated);
    setIsLoading(false);

    // Define public pages that don't require authentication
    const publicPages = ["/", "/auth/login", "/auth/register", "/terms"];
    
    // If authenticated and trying to access login/landing pages, redirect to home
    if (authenticated && (location.pathname === "/" || location.pathname === "/auth/login" || location.pathname === "/auth/register")) {
      navigate("/home");
      return;
    }
    
    // If not authenticated and trying to access protected pages, redirect to login
    if (!authenticated && !publicPages.includes(location.pathname)) {
      // Store the intended destination for after login
      setIntendedDestination(location.pathname);
      navigate("/auth/login");
      return;
    }
  }, [location.pathname, navigate]); // Re-check on route changes

  // If still loading, show nothing
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
