// Utility functions for managing authentication and navigation intent

export const USER_ID_KEY = "userId";
export const INTENDED_DESTINATION_KEY = "intendedDestination";
export const AUTH_EXPIRY_KEY = "authExpiry";
const AUTH_DURATION_DAYS = 7; // Keep user logged in for 7 days

export const isAuthenticated = () => {
	const userId = localStorage.getItem(USER_ID_KEY);
	if (!userId) {
		return false;
	}

	// Check if authentication has expired
	const expiryTime = localStorage.getItem(AUTH_EXPIRY_KEY);
	if (expiryTime) {
		const now = Date.now();
		if (now > parseInt(expiryTime, 10)) {
			// Token expired, clear it
			logout();
			return false;
		}
	}

	return true;
};

export const getCurrentUserId = () => {
	// Only return userId if still authenticated
	if (isAuthenticated()) {
		return localStorage.getItem(USER_ID_KEY);
	}
	return null;
};

export const setAuthenticated = (userId) => {
	localStorage.setItem(USER_ID_KEY, userId);
	// Set expiration time (7 days from now)
	const expiryTime = Date.now() + (AUTH_DURATION_DAYS * 24 * 60 * 60 * 1000);
	localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString());
};

export const logout = () => {
	localStorage.removeItem(USER_ID_KEY);
	localStorage.removeItem(AUTH_EXPIRY_KEY);
	localStorage.removeItem(INTENDED_DESTINATION_KEY);
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
