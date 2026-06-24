// @ts-nocheck
import React, { useState } from "react";
import { TextField, Button, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../../api";
import { saveUsername } from "../../utils/authUtils";
import AuthLayout from "../AuthLayout";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!username || !password || !confirmPassword || !name) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await authAPI.register({ username, password, name });
      saveUsername(username);
      navigate("/auth/login");
    } catch (err) {
      console.error("Registration error:", err);
      if (err.response) {
        const status = err.response.status;
        const serverMessage = err.response.data?.error || err.response.data?.message;
        if (status === 409) setError(serverMessage || "That username is already taken.");
        else if (status === 400) setError(serverMessage || "Please fill in all fields.");
        else setError(serverMessage || "Registration failed. Please try again.");
      } else if (err.request) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') handleRegister();
  };

  return (
    <AuthLayout title="Register">
      <TextField
        label="Full Name"
        placeholder="Enter your full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyPress={handleKeyPress}
        fullWidth
      />
      <TextField
        label="Username"
        placeholder="Choose a username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyPress={handleKeyPress}
        fullWidth
      />
      <TextField
        type="password"
        label="Password"
        placeholder="Create a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyPress={handleKeyPress}
        fullWidth
      />
      <TextField
        type="password"
        label="Confirm Password"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onKeyPress={handleKeyPress}
        fullWidth
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Button
        onClick={handleRegister}
        disabled={loading || !username || !password || !confirmPassword || !name}
        variant="contained"
        color="success"
        size="large"
        fullWidth
      >
        {loading ? 'Creating Account...' : 'Register'}
      </Button>
      <Button onClick={() => navigate("/")} variant="text" color="primary" fullWidth>
        Back to Landing
      </Button>
    </AuthLayout>
  );
}

export default RegisterPage;
