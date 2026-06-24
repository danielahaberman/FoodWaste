import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import TermsAndConditions from "./Pages/TermsAndConditions";
import { getCurrentUserId } from "../utils/authUtils";
import { authAPI } from "../api";

const TERMS_CACHE_KEY_PREFIX = "termsAccepted:";

const readTermsCache = (userId) => {
  if (!userId) return true;
  return localStorage.getItem(`${TERMS_CACHE_KEY_PREFIX}${userId}`) === "true";
};

function TermsGuard({ children }) {
  const location = useLocation();
  const userId = getCurrentUserId();
  const [termsAccepted, setTermsAccepted] = useState(() => {
    if (!userId) return true;
    return readTermsCache(userId) ? true : null;
  });

  useEffect(() => {
    let isMounted = true;

    const checkTermsStatus = async () => {
      if (!userId) {
        if (isMounted) setTermsAccepted(true);
        return;
      }

      const cachedAccepted = readTermsCache(userId);
      if (cachedAccepted && isMounted) {
        setTermsAccepted(true);
      }

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Terms check timeout")), 5000)
        );

        const response = await Promise.race([
          authAPI.getTermsStatus(userId),
          timeoutPromise,
        ]);

        if (!isMounted) return;

        const accepted = !!response.data?.termsAccepted;
        setTermsAccepted(accepted);
        if (accepted) {
          localStorage.setItem(`${TERMS_CACHE_KEY_PREFIX}${userId}`, "true");
        } else {
          localStorage.removeItem(`${TERMS_CACHE_KEY_PREFIX}${userId}`);
        }
      } catch (error) {
        console.error("Error checking terms status:", error);
        if (isMounted) {
          setTermsAccepted((prev) => (prev === true || readTermsCache(userId) ? true : false));
        }
      }
    };

    checkTermsStatus();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const publicPages = ["/", "/auth/login", "/auth/register"];
  const termsPage = "/terms";

  if (location.pathname === termsPage) {
    return children;
  }

  if (termsAccepted === false && !publicPages.includes(location.pathname) && userId) {
    return <TermsAndConditions onTermsAccepted={() => setTermsAccepted(true)} />;
  }

  // Render immediately when cached/unknown; only block if explicitly not accepted.
  return children;
}

export default TermsGuard;
