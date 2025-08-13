// Utility functions for managing authentication and navigation intent

export const USER_ID_KEY = "userId";
export const INTENDED_DESTINATION_KEY = "intendedDestination";

export const isAuthenticated = () => {
	return !!localStorage.getItem(USER_ID_KEY);
};

export const getCurrentUserId = () => {
	return localStorage.getItem(USER_ID_KEY);
};

export const setAuthenticated = (userId) => {
	localStorage.setItem(USER_ID_KEY, userId);
};

export const logout = () => {
	localStorage.removeItem(USER_ID_KEY);
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
