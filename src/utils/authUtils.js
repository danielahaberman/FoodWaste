// Utility functions for managing authentication and navigation intent

export const USER_ID_KEY = "userId";
export const USERNAME_KEY = "username";
export const INTENDED_DESTINATION_KEY = "intendedDestination";
export const AUTH_EXPIRY_KEY = "authExpiry";
export const LOGIN_DATE_KEY = "loginDate";
export const LAST_ROUTE_KEY = "lastRoute";
const AUTH_DURATION_DAYS = 7; // Keep user logged in for 7 days

// Routes that shouldn't be persisted (public/auth pages)
const EXCLUDED_ROUTES = ["/", "/auth/login", "/auth/register", "/terms", "/admin"];

// Routes that should redirect to /log on app start if authenticated
const DEFAULT_AUTHENTICATED_ROUTE = "/log";

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
		// Simple check: if userId exists in localStorage, user is authenticated
		// No need for complex expiry/token logic since this isn't highly secure
		const userId = localStorage.getItem(USER_ID_KEY);
		return !!userId; // Return true if userId exists, false otherwise
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
