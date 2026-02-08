import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import TermsAndConditions from "./Pages/TermsAndConditions";
import { getCurrentUserId } from "../utils/authUtils";
import { authAPI } from "../api";

const TERMS_CACHE_KEY_PREFIX = "termsAccepted:";

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
          // Not authenticated. Don't block rendering here; AuthGuard handles gating.
          setTermsAccepted(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const cachedAccepted = localStorage.getItem(`${TERMS_CACHE_KEY_PREFIX}${userId}`) === "true";
        // If we already know they accepted (locally), don't flash the terms screen while we re-check.
        if (cachedAccepted && isMounted) {
          setTermsAccepted(true);
        }

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Terms check timeout')), 3000)
        );
        
        const response = await Promise.race([
          authAPI.getTermsStatus(userId),
          timeoutPromise
        ]);
        
        if (isMounted) {
          const accepted = !!response.data?.termsAccepted;
          setTermsAccepted(accepted);
          if (accepted) {
            localStorage.setItem(`${TERMS_CACHE_KEY_PREFIX}${userId}`, "true");
          } else {
            localStorage.removeItem(`${TERMS_CACHE_KEY_PREFIX}${userId}`);
          }
        }
      } catch (error) {
        console.error("Error checking terms status:", error);
        if (isMounted) {
          // Avoid re-showing terms for users who've already accepted.
          // If we have no cached acceptance, we still require accepting.
          const cachedAccepted = localStorage.getItem(`${TERMS_CACHE_KEY_PREFIX}${userId}`) === "true";
          setTermsAccepted((prev) => (prev === true || cachedAccepted ? true : false));
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
  }, [userId]); // Only re-check when the authenticated user changes

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
