// @ts-nocheck
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { TextField, Button, Typography, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  setAuthenticated,
  getIntendedDestination,
  clearIntendedDestination,
  getUsername,
  saveUsername,
  isAuthenticated,
  getLastRoute,
} from "../../utils/authUtils";
import { authAPI } from "../../api";
import { usePWA } from "../../context/PWAContext";
import AuthLayout from "../AuthLayout";

function LoginPage() {
  const [email, setEmail] = useState(getUsername());
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showPostLoginBanner } = usePWA();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(getLastRoute(), { replace: true });
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await authAPI.login({ username: email, password });
      saveUsername(email);
      setAuthenticated(response.data.user_id, email);
      showPostLoginBanner();

      const intendedDestination = getIntendedDestination();
      if (intendedDestination) {
        clearIntendedDestination();
        navigate(intendedDestination);
      } else {
        navigate("/log");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.response) {
        const status = err.response.status;
        const responseData = err.response.data || {};
        const serverMessage = responseData.error || responseData.message;
        if (status === 401) setError(serverMessage || "Invalid username or password");
        else if (status === 404) setError(serverMessage || "User not found");
        else if (status === 400) setError(serverMessage || "Please fill in all fields");
        else setError(serverMessage || "Server error. Please try again.");
      } else if (err.request) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(err.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') handleLogin();
  };

  return (
    <AuthLayout title="Login">
      <TextField
        label="Username"
        placeholder="Enter your username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyPress={handleKeyPress}
        fullWidth
      />
      <TextField
        type="password"
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyPress={handleKeyPress}
        fullWidth
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Button
        onClick={handleLogin}
        disabled={loading}
        variant="contained"
        color="primary"
        size="large"
        fullWidth
      >
        {loading ? 'Logging in...' : 'Login'}
      </Button>
      <Button onClick={() => navigate("/")} variant="text" color="primary" fullWidth>
        Back to Landing
      </Button>
    </AuthLayout>
  );
}

export default LoginPage;
