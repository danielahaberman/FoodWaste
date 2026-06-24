import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, setIntendedDestination, getLastRoute } from "../utils/authUtils";

const PUBLIC_PAGES = ["/", "/auth/login", "/auth/register", "/terms"];

function AuthGuard({ children }) {
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(() => isAuthenticated());
  const location = useLocation();

  // Auth is a synchronous localStorage check — no loading gate needed.
  useEffect(() => {
    setIsUserAuthenticated(isAuthenticated());
  }, []);

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
