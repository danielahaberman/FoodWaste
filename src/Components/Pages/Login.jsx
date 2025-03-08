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
const navigate = useNavigate()
  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5001/login", {
        username: email,
        password,
      });
      // Store the token in localStorage or state
      console.log("response", response)
      localStorage.setItem("userId", response.data.user_id);
      navigate("/home")
    } catch (err) {
      setError("Invalid credentials or server error");
    }
  };

  return (
    <PageLayout>
      <div
        style={{
          fontSize: "20px",
          width: "100%",
          marginLeft: "auto",
          marginRight: "auto",
          fontWeight: "bold",
          fontFamily: "cursive",
        }}
      >
        Login
      </div>

      <div
        style={{
          border: "1px solid black",
          width: "100%",
          height: "100%",
          borderRadius: "8px",
          marginLeft: "auto",
          marginRight: "auto",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "20px",
            width: "200px",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TextField
            label="Username"
            variant="standard"
            placeholder="User Name"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            type="password"
            label="Password"
            variant="standard"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div style={{ color: "red" }}>{error}</div>}
          <Button onClick={handleLogin}>Login</Button>
        </div>
      </div>

      <div>image</div>
    </PageLayout>
  );
}

export default LoginPage;
