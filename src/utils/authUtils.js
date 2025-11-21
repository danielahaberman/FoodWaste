// Utility functions for managing authentication and navigation intent

export const USER_ID_KEY = "userId";
export const INTENDED_DESTINATION_KEY = "intendedDestination";
export const AUTH_EXPIRY_KEY = "authExpiry";
export const LOGIN_DATE_KEY = "loginDate";
const AUTH_DURATION_DAYS = 7; // Keep user logged in for 7 days
const AUTO_LOGIN_DAYS = 3; // Auto-login if logged in within 3 days

export const isAuthenticated = () => {
	const userId = localStorage.getItem(USER_ID_KEY);
	if (!userId) {
		console.log("[isAuthenticated] No userId found");
		return false;
	}

	// Check if authentication has expired
	const expiryTime = localStorage.getItem(AUTH_EXPIRY_KEY);
	const loginDate = localStorage.getItem(LOGIN_DATE_KEY);
	console.log("[isAuthenticated] Check:", { userId, expiryTime, loginDate });
	
	if (expiryTime) {
		const now = Date.now();
		const expiryTimestamp = parseInt(expiryTime, 10);
		
		// Check if expiryTime is valid number
		if (isNaN(expiryTimestamp)) {
			console.log("[isAuthenticated] Invalid expiryTime, checking auto-login");
			// Invalid expiry time - check if we should auto-login
			if (shouldAutoLogin()) {
				// Restore authentication by resetting expiry
				const newExpiryTime = Date.now() + (AUTH_DURATION_DAYS * 24 * 60 * 60 * 1000);
				localStorage.setItem(AUTH_EXPIRY_KEY, newExpiryTime.toString());
				console.log("[isAuthenticated] Auto-login restored auth");
				return true;
			}
			// Invalid expiry and can't auto-login - clear it
			console.log("[isAuthenticated] Invalid expiry, can't auto-login, logging out");
			logout();
			return false;
		}
		
		if (now > expiryTimestamp) {
			console.log("[isAuthenticated] Expiry passed, checking auto-login");
			// Token expired - check if we should auto-login (within 3 days)
			if (shouldAutoLogin()) {
				// Restore authentication by resetting expiry
				const newExpiryTime = Date.now() + (AUTH_DURATION_DAYS * 24 * 60 * 60 * 1000);
				localStorage.setItem(AUTH_EXPIRY_KEY, newExpiryTime.toString());
				console.log("[isAuthenticated] Auto-login restored auth");
				return true;
			}
			// Token expired and too old, clear it
			console.log("[isAuthenticated] Expiry too old, logging out");
			logout();
			return false;
		}
		// Expiry time exists and is valid (not expired)
		console.log("[isAuthenticated] Valid auth");
		return true;
	}

	// No expiry time set - check if we have a recent login date (within 3 days)
	// This handles cases where expiryTime might not be set but user just logged in
	console.log("[isAuthenticated] No expiryTime, checking auto-login");
	if (shouldAutoLogin()) {
		// Restore authentication by setting expiry
		const newExpiryTime = Date.now() + (AUTH_DURATION_DAYS * 24 * 60 * 60 * 1000);
		localStorage.setItem(AUTH_EXPIRY_KEY, newExpiryTime.toString());
		console.log("[isAuthenticated] Auto-login restored auth");
		return true;
	}

	// No expiry time and login date is too old or missing - not authenticated
	// If userId exists but no expiry/loginDate, might be a race condition - don't logout
	// Just return false and let AuthGuard handle redirect
	console.log("[isAuthenticated] No expiryTime and can't auto-login, returning false");
	return false;
};

export const getCurrentUserId = () => {
	// Only return userId if still authenticated
	if (isAuthenticated()) {
		return localStorage.getItem(USER_ID_KEY);
	}
	return null;
};

export const setAuthenticated = (userId) => {
	console.log("[setAuthenticated] Setting auth for userId:", userId);
	localStorage.setItem(USER_ID_KEY, userId);
	// Set expiration time (7 days from now)
	const expiryTime = Date.now() + (AUTH_DURATION_DAYS * 24 * 60 * 60 * 1000);
	localStorage.setItem(AUTH_EXPIRY_KEY, expiryTime.toString());
	// Store login date for auto-login check
	const loginDate = Date.now();
	localStorage.setItem(LOGIN_DATE_KEY, loginDate.toString());
	console.log("[setAuthenticated] Set values:", { userId, expiryTime, loginDate });
	// Verify it was set
	const verify = {
		userId: localStorage.getItem(USER_ID_KEY),
		expiryTime: localStorage.getItem(AUTH_EXPIRY_KEY),
		loginDate: localStorage.getItem(LOGIN_DATE_KEY)
	};
	console.log("[setAuthenticated] Verified:", verify);
};

export const logout = () => {
	localStorage.removeItem(USER_ID_KEY);
	localStorage.removeItem(AUTH_EXPIRY_KEY);
	localStorage.removeItem(INTENDED_DESTINATION_KEY);
	localStorage.removeItem(LOGIN_DATE_KEY);
};

export const shouldAutoLogin = () => {
	const loginDate = localStorage.getItem(LOGIN_DATE_KEY);
	console.log("[shouldAutoLogin] loginDate:", loginDate);
	if (!loginDate) {
		console.log("[shouldAutoLogin] No loginDate, returning false");
		return false;
	}
	
	const loginTimestamp = parseInt(loginDate, 10);
	const now = Date.now();
	const daysSinceLogin = (now - loginTimestamp) / (1000 * 60 * 60 * 24);
	console.log("[shouldAutoLogin] daysSinceLogin:", daysSinceLogin, "AUTO_LOGIN_DAYS:", AUTO_LOGIN_DAYS);
	
	// Auto-login if logged in within 3 days
	const result = daysSinceLogin < AUTO_LOGIN_DAYS;
	console.log("[shouldAutoLogin] Result:", result);
	return result;
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
