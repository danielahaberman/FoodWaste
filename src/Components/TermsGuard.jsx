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
    let isMounted = true;
    
    const checkTermsStatus = async () => {
      if (!userId) {
        if (isMounted) {
          setTermsAccepted(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Terms check timeout')), 3000)
        );
        
        const response = await Promise.race([
          authAPI.getTermsStatus(userId),
          timeoutPromise
        ]);
        
        if (isMounted) {
          setTermsAccepted(response.data.termsAccepted);
        }
      } catch (error) {
        console.error("Error checking terms status:", error);
        // Default to false (terms not accepted) on error to allow access
        if (isMounted) {
          setTermsAccepted(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkTermsStatus();
    
    return () => {
      isMounted = false;
    };
  }, [userId, location.pathname]); // Re-check when route changes too

  // If still loading or termsAccepted is null (not yet checked), show nothing
  if (isLoading || termsAccepted === null) {
    return null;
  }

  // Define pages that don't require terms acceptance or already show terms
  const publicPages = ["/", "/auth/login", "/auth/register"];
  const termsPage = "/terms";
  
  // If on the /terms route, let it render normally (don't double-render)
  if (location.pathname === termsPage) {
    return children;
  }
  
  // If terms not accepted (explicitly false) and trying to access protected pages, show terms page
  // But only if user is authenticated (AuthGuard will handle unauthenticated users)
  if (termsAccepted === false && !publicPages.includes(location.pathname) && userId) {
    return <TermsAndConditions onTermsAccepted={() => setTermsAccepted(true)} />;
  }

  // If terms accepted or on public page, render the children (normal app content)
  return children;
}

export default TermsGuard;
