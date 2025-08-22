import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import TermsAndConditions from "./Pages/TermsAndConditions";
import { getCurrentUserId } from "../utils/authUtils";
import { authAPI } from "../api";

function TermsGuard({ children }) {
  const location = useLocation();
  const [termsAccepted, setTermsAccepted] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const userId = getCurrentUserId();

  useEffect(() => {
    const checkTermsStatus = async () => {
      if (!userId) {
        setTermsAccepted(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await authAPI.getTermsStatus(userId);
        setTermsAccepted(response.data.termsAccepted);
      } catch (error) {
        console.error("Error checking terms status:", error);
        setTermsAccepted(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTermsStatus();
  }, [userId]);

  // If still loading, show nothing
  if (isLoading) {
    return null;
  }

  // Define pages that don't require terms acceptance
  const publicPages = ["/", "/auth/login", "/auth/register", "/terms"];
  
  // If terms not accepted and trying to access protected pages, show terms page
  // But only if user is authenticated (AuthGuard will handle unauthenticated users)
  if (!termsAccepted && !publicPages.includes(location.pathname) && userId) {
    return <TermsAndConditions onTermsAccepted={() => setTermsAccepted(true)} />;
  }

  // If terms accepted, render the children (normal app content)
  return children;
}

export default TermsGuard;
