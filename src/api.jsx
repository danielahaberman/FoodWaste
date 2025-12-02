// @ts-nocheck
// src/api.js
import axios from "axios";

// Use relative URLs if VITE_API_URL is not set (same origin)
// This prevents CORS issues when frontend and backend are on the same domain
const baseURL = import.meta.env.VITE_API_URL || '';

// Log API configuration in development
if (import.meta.env.DEV) {
  console.log('🌐 API Configuration:');
  console.log('   Base URL:', baseURL || '(relative - will use Vite proxy)');
  console.log('   Current Origin:', window.location.origin);
  console.log('   User Agent:', navigator.userAgent);
}

const api = axios.create({
  baseURL,
  withCredentials: true, // if you're using cookies
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    // Log all requests in development
    if (import.meta.env.DEV) {
      const fullURL = (config.baseURL || '') + config.url;
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${fullURL}`);
      console.log(`   From origin: ${window.location.origin}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  response => {
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  error => {
    // Handle network errors (CORS, timeout, etc.)
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      const attemptedURL = (error.config?.baseURL || '') + error.config?.url;
      console.error('❌ Network Error - Check CORS configuration and API URL:', {
        attemptedURL,
        baseURL: error.config?.baseURL || '(relative - should be proxied)',
        currentOrigin: window.location.origin,
        message: error.message,
        code: error.code
      });
      console.error('💡 Make sure:');
      console.error('   1. Backend server is running on port 5001');
      console.error('   2. Vite dev server proxy is configured correctly');
      console.error('   3. Both servers are accessible from your network');
      
      // Show user-friendly error
      if (error.config?.url?.includes('/survey-response')) {
        console.error('Survey submission failed - network error. Please check your connection and try again.');
      }
    }
    
    if (error.response) {
      const status = error.response.status;

      // Only redirect to login if it's NOT already a login/register request
      // This prevents redirecting when user is already on login page with wrong credentials
      const isAuthRequest = error.config?.url?.includes('/auth/login') || 
                           error.config?.url?.includes('/auth/register');
      
      if ((status === 401 || status === 403) && !isAuthRequest) {
        console.warn("Redirecting to login...");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

// Authentication endpoints
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  acceptTerms: (userId) => api.post("/auth/accept-terms", { user_id: userId }),
  getTermsStatus: (userId) => api.get(`/auth/terms-status/${userId}`),
};

// Food purchase endpoints
export const foodPurchaseAPI = {
  getWeeklySummary: (params) => api.get("/purchases/weekly-summary", { params }),
  getFoodPurchases: (params) => api.get("/food-purchases", { params }),
  getFoodItems: (params) => api.get("/food-items", { params }),
  addFoodItem: (foodData) => api.post("/add-food-item", foodData),
  addPurchase: (purchaseData) => api.post("/purchase", purchaseData),
  deletePurchase: (purchaseId, params) => api.delete(`/purchase/${purchaseId}`, { params }),
};

// Food categories and quantity types
export const foodDataAPI = {
  getQuantityTypes: (params) => api.get("/quantity-types", { params }),
  getFoodCategories: (params) => api.get("/food-categories", { params }),
};

// Survey endpoints
export const surveyAPI = {
  getSurveyStatus: (userId) => api.get(`/api/surveys/status/${userId}`),
  getSurveyQuestions: (params) => api.get("/survey-questions", { params }),
  getSurveyResponses: (params) => api.get("/api/surveys/responses", { params }),
  submitSurveyResponse: (responseData) => api.post("/survey-response", responseData),
};

// Consumption/Waste endpoints
export const consumptionAPI = {
  log: (data) => api.post("/consumption-log", data),
  getSummary: (params) => api.get("/consumption-summary", { params }),
  getBatchSummary: (params) => api.get("/consumption-summary/batch", { params }),
  autoWasteWeek: (data) => api.post("/consumption-log/auto-waste-week", data),
  autoConsumeWeek: (data) => api.post("/consumption-log/auto-consume-week", data),
  getOverall: (params) => api.get("/consumption-summary/overall", { params }),
  getWeek: (params) => api.get("/consumption-summary/week", { params }),
  getTrends: (params) => api.get("/consumption-trends", { params }),
  getByCategory: (params) => api.get("/consumption-by-category", { params }),
  getLogs: (params) => api.get("/consumption-logs", { params }),
  editLog: (id, data, params) => api.patch(`/consumption-log/${id}`, data, { params }),
  deleteLog: (id, params) => api.delete(`/consumption-log/${id}`, { params }),
};

// Daily Tasks endpoints
export const dailyTasksAPI = {
  getTodayTasks: (params) => api.get("/api/daily-tasks/today", { params }),
  markPopupShown: (data) => api.post("/api/daily-tasks/mark-popup-shown", data),
  getStreak: (params) => api.get("/api/daily-tasks/streak", { params }),
};

// Leaderboard endpoints
export const leaderboardAPI = {
  getCurrentStreaks: (params) => api.get("/api/leaderboard/current-streaks", { params }),
  getLongestStreaks: (params) => api.get("/api/leaderboard/longest-streaks", { params }),
  getTotalCompletions: (params) => api.get("/api/leaderboard/total-completions", { params }),
};

// Admin Analytics endpoints
export const adminAPI = {
  getOverview: () => api.get("/admin/analytics/overview"),
  getDemographics: () => api.get("/admin/analytics/demographics"),
  getSurveyResponses: (stage) => api.get(`/admin/analytics/survey-responses${stage ? `?stage=${stage}` : ''}`),
  getQuestionResponses: (questionId, stage) => api.get(`/admin/analytics/question-responses${questionId ? `?questionId=${questionId}` : ''}${stage ? `&stage=${stage}` : ''}`),
  getWastePatterns: () => api.get("/admin/analytics/waste-patterns"),
  getPurchaseTrends: () => api.get("/admin/analytics/purchase-trends"),
  
  // Export endpoints
  exportRawData: () => api.get("/admin/export/raw-data"),
  exportSurveyResponses: (stage) => api.get(`/admin/export/survey-responses${stage ? `?stage=${stage}` : ''}`),
  exportUserDemographics: () => api.get("/admin/export/user-demographics"),
  exportWastePatterns: () => api.get("/admin/export/waste-patterns"),
  
  // Fake Data Management endpoints
  generateFakeData: (count) => api.post("/admin/generate-fake-data", { count }),
  getFakeUsersCount: () => api.get("/admin/fake-users-count"),
  cleanupFakeData: () => api.delete("/admin/cleanup-fake-data"),
  
  // User Data Management endpoints
  deleteAllUsers: (confirm) => api.delete("/admin/delete-all-users", { data: { confirm } }),
  deleteAllUserData: (confirm) => api.delete("/admin/delete-all-user-data", { data: { confirm } }),
  searchUsers: (query, limit = 10) => api.get("/admin/search-users", { params: { q: query, limit } }),
  searchUser: (userId) => api.get(`/admin/search-user/${userId}`),
  deleteUser: (userId, confirm) => api.delete(`/admin/delete-user/${userId}`, { data: { confirm } }),
  deleteUserData: (userId, confirm) => api.delete(`/admin/delete-user-data/${userId}`, { data: { confirm } }),
  deleteUserStreak: (userId, confirm) => api.delete(`/admin/delete-user-streak/${userId}`, { data: { confirm } })
};

export default api;
