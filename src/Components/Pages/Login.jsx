// @ts-nocheck
/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import PageLayout from "../PageLayout";
import { TextField, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { setAuthenticated, getIntendedDestination, clearIntendedDestination } from "../../utils/authUtils";
import { authAPI } from "../../api";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleLogin = async () => {
    try {
      const response = await authAPI.login({
        username: email,
        password,
      });
      // Store the token in localStorage or state
      console.log("response", response);
      setAuthenticated(response.data.user_id);
      
      // Check if terms have been accepted
      try {
        const termsResponse = await authAPI.getTermsStatus(response.data.user_id);
        if (!termsResponse.data.termsAccepted) {
          navigate("/terms");
        } else {
          // Check if there's a stored intended destination
          const intendedDestination = getIntendedDestination();
          if (intendedDestination) {
            clearIntendedDestination();
            navigate(intendedDestination);
          } else {
            navigate("/home");
          }
        }
      } catch (error) {
        console.error("Error checking terms status:", error);
        // If we can't check terms status, proceed to home
        navigate("/home");
      }
    } catch (err) {
      setError("Invalid credentials or server error");
    }
  };

  return (
    <PageLayout>
      <div
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
          color: "#F2F3F4",
          marginBottom: "16px",
          backgroundColor: "#FF9F43",
          padding: "12px",
          borderRadius: "8px"
        }}
      >
        Login
      </div>

      <div
        style={{
          border: "1px solid #01796F",
          width: "100%",
          maxWidth: "400px",
          borderRadius: "12px",
          margin: "auto",
          padding: "24px",
          backgroundColor: "#FFB37A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <TextField
          label="Username"
          variant="standard"
          placeholder="User Name"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%" }}
        />
        <TextField
          type="password"
          label="Password"
          variant="standard"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginTop: "16px" }}
        />
        {error && <div style={{ color: "red", marginTop: "8px" }}>{error}</div>}
        <Button
          onClick={handleLogin}
          style={{ 
            backgroundColor: "#01796F", 
            color: "#F2F3F4", 
            marginTop: "16px",
            width: "100%",
            borderRadius: "8px"
          }}
          variant="contained"
        >
          Login
        </Button>
        <Button
          onClick={() => navigate("/")}
          variant="text"
          style={{
            marginTop: "8px",
            width: "100%",
            color: "#01796F",
            textDecoration: "underline"
          }}
        >
          Back to Landing
        </Button>
      </div>
    </PageLayout>
  );
}

export default LoginPage;
