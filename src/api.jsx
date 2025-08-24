// @ts-nocheck
// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // if you're using cookies
});

// Add interceptor to handle errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401 || status === 403) {
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
  exportWastePatterns: () => api.get("/admin/export/waste-patterns")
};

export default api;
