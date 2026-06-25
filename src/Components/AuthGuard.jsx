import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, setIntendedDestination, getLastRoute } from "../utils/authUtils";

const PUBLIC_PAGES = ["/", "/auth/login", "/auth/register", "/terms"];

function AuthGuard({ children }) {
  const location = useLocation();
  const isUserAuthenticated = isAuthenticated();

  if (isUserAuthenticated && PUBLIC_PAGES.includes(location.pathname)) {
    return <Navigate to={getLastRoute()} replace />;
  }

  if (!isUserAuthenticated && !PUBLIC_PAGES.includes(location.pathname)) {
    setIntendedDestination(location.pathname);
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}

export default AuthGuard;
