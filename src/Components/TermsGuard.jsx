import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TermsAndConditions from "./Pages/TermsAndConditions";
import { getCurrentUserId } from "../utils/authUtils";

function TermsGuard({ children }) {
  const [termsAccepted, setTermsAccepted] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if terms have been accepted
    const accepted = localStorage.getItem("termsAccepted") === "true";
    setTermsAccepted(accepted);
    setIsLoading(false);
  }, []);

  // If still loading, show nothing
  if (isLoading) {
    return null;
  }

  // Define pages that don't require terms acceptance
  const publicPages = ["/", "/auth/login", "/auth/register", "/terms"];
  
  // If terms not accepted and trying to access protected pages, show terms page
  // But only if user is authenticated (AuthGuard will handle unauthenticated users)
  const userId = getCurrentUserId();
  if (!termsAccepted && !publicPages.includes(location.pathname) && userId) {
    return <TermsAndConditions />;
  }

  // If terms accepted, render the children (normal app content)
  return children;
}

export default TermsGuard;
