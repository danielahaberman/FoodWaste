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

export default api;
