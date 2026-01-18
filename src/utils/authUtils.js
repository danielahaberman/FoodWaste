// Utility functions for managing authentication and navigation intent

export const USER_ID_KEY = "userId";
export const USERNAME_KEY = "username";
export const INTENDED_DESTINATION_KEY = "intendedDestination";
export const AUTH_EXPIRY_KEY = "authExpiry";
export const LOGIN_DATE_KEY = "loginDate";
export const LAST_ROUTE_KEY = "lastRoute";
export const AUTH_FEATURE_FLAG = "auth-session-v1"; // Feature flag for new auth system
const AUTH_DURATION_DAYS = 7; // Keep user logged in for 7 days

// Routes that shouldn't be persisted (public/auth pages)
const EXCLUDED_ROUTES = ["/", "/auth/login", "/auth/register", "/terms", "/admin"];

// Routes that should redirect to /log on app start if authenticated
const DEFAULT_AUTHENTICATED_ROUTE = "/log";

/**
 * Migration function to clear old auth data if user hasn't been migrated yet
 * This ensures users with old localStorage data don't have issues with the new auth system
 */
export const migrateAuthData = () => {
	try {
		const hasFeatureFlag = localStorage.getItem(AUTH_FEATURE_FLAG);
		
		// If feature flag exists, user is already on new system - no migration needed
		if (hasFeatureFlag) {
			return;
		}

		console.log('[migrateAuthData] Migrating user from old auth system - clearing old auth data');
		
		// Clear old auth-related localStorage items
		// We preserve other keys like PWA preferences, survey modals, daily tasks, etc.
		const authKeysToClear = [
			USER_ID_KEY,
			USERNAME_KEY,
			AUTH_EXPIRY_KEY,
			LOGIN_DATE_KEY,
			INTENDED_DESTINATION_KEY,
			LAST_ROUTE_KEY
		];

		authKeysToClear.forEach(key => {
			localStorage.removeItem(key);
		});

		// Set feature flag to indicate migration is complete
		localStorage.setItem(AUTH_FEATURE_FLAG, "true");
		
		console.log('[migrateAuthData] Migration complete - old auth data cleared');
	} catch (error) {
		console.error('[migrateAuthData] Error during migration:', error);
		// On error, still set the flag to prevent repeated attempts
		try {
			localStorage.setItem(AUTH_FEATURE_FLAG, "true");
		} catch (e) {
			console.error('[migrateAuthData] Failed to set feature flag:', e);
		}
	}
};

export const saveLastRoute = (pathname) => {
	if (typeof pathname === "string" && pathname.length > 0) {
		// Only save if it's not an excluded route
		if (!EXCLUDED_ROUTES.includes(pathname)) {
			localStorage.setItem(LAST_ROUTE_KEY, pathname);
		}
	}
};

export const getLastRoute = () => {
	return localStorage.getItem(LAST_ROUTE_KEY) || DEFAULT_AUTHENTICATED_ROUTE; // Default to /log if no last route
};

export const clearLastRoute = () => {
	localStorage.removeItem(LAST_ROUTE_KEY);
};

export const isAuthenticated = () => {
	try {
		const userId = localStorage.getItem(USER_ID_KEY);
		if (!userId) {
			return false;
		}

		// Check if auth has expired
		const expiryTime = localStorage.getItem(AUTH_EXPIRY_KEY);
		if (expiryTime) {
			const expiryTimestamp = parseInt(expiryTime, 10);
			const now = Date.now();
			if (now > expiryTimestamp) {
				// Auth has expired, clear it
				console.log('[isAuthenticated] Auth expired, clearing session');
				logout();
				return false;
			}
		}

		return true;
	} catch (error) {
		console.error('[isAuthenticated] Error:', error);
		// On error (e.g., localStorage not available), default to not authenticated
		return false;
	}
};

export const getCurrentUserId = () => {
	// Only return userId if still authenticated
	if (isAuthenticated()) {
		return localStorage.getItem(USER_ID_KEY);
	}
	return null;
};

export const setAuthenticated = (userId, username = null) => {
	console.log("[setAuthenticated] Setting auth for userId:", userId);
	
	// Ensure feature flag is set when user logs in with new system
	localStorage.setItem(AUTH_FEATURE_FLAG, "true");
	
	localStorage.setItem(USER_ID_KEY, userId);
	// Save username if provided
	if (username) {
		localStorage.setItem(USERNAME_KEY, username);
	}
	// Set expiration time (7 days from now)
	const expiryTime = Date.now() + (AUTH_DURATION_DAYS * 24 * 60 * 60 * 1000);
	localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString());
	// Store login date
	const loginDate = Date.now();
	localStorage.setItem(LOGIN_DATE_KEY, loginDate.toString());
	console.log("[setAuthenticated] Set values:", { userId, username, expiryTime, loginDate });
	// Verify it was set
	const verify = {
		userId: localStorage.getItem(USER_ID_KEY),
		username: localStorage.getItem(USERNAME_KEY),
		expiryTime: localStorage.getItem(AUTH_EXPIRY_KEY),
		loginDate: localStorage.getItem(LOGIN_DATE_KEY)
	};
	console.log("[setAuthenticated] Verified:", verify);
};

export const saveUsername = (username) => {
	if (username && typeof username === "string" && username.length > 0) {
		localStorage.setItem(USERNAME_KEY, username);
	}
};

export const getUsername = () => {
	return localStorage.getItem(USERNAME_KEY) || "";
};

export const logout = () => {
	localStorage.removeItem(USER_ID_KEY);
	localStorage.removeItem(USERNAME_KEY);
	localStorage.removeItem(AUTH_EXPIRY_KEY);
	localStorage.removeItem(INTENDED_DESTINATION_KEY);
	localStorage.removeItem(LOGIN_DATE_KEY);
	clearLastRoute(); // Clear last route on logout
	// Note: We keep AUTH_FEATURE_FLAG so user stays on new system even after logout
};


export const setIntendedDestination = (path) => {
	if (typeof path === "string" && path.length > 0) {
		localStorage.setItem(INTENDED_DESTINATION_KEY, path);
	}
};

export const getIntendedDestination = () => {
	return localStorage.getItem(INTENDED_DESTINATION_KEY);
};

export const clearIntendedDestination = () => {
	localStorage.removeItem(INTENDED_DESTINATION_KEY);
};
