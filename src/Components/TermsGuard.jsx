import React from "react";
import { useLocation } from "react-router-dom";
import TermsAndConditions from "./Pages/TermsAndConditions";
import { getCurrentUserId } from "../utils/authUtils";

function TermsGuard({ children }) {
  const location = useLocation();
  const termsAccepted = localStorage.getItem("termsAccepted") === "true";

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
