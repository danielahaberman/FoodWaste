// @ts-nocheck
/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import PageLayout from "../PageLayout";
import { TextField, Button } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
const API_URL = process.env.REACT_APP_API_URL;
  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username: email,
        password,
      });
      // Store the token in localStorage or state
      console.log("response", response);
      localStorage.setItem("userId", response.data.user_id);
      navigate("/home");
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
      </div>
    </PageLayout>
  );
}

export default LoginPage;
