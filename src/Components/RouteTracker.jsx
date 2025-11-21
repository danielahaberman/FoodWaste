// @ts-nocheck
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { saveLastRoute } from "../utils/authUtils";

/**
 * Component that tracks route changes and saves the last route to localStorage
 * This allows the PWA to restore the user's last location when relaunched
 */
function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    // Save the current route whenever it changes
    saveLastRoute(location.pathname);
  }, [location.pathname]);

  // This component doesn't render anything
  return null;
}

export default RouteTracker;

