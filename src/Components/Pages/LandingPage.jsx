/* eslint-disable no-unused-vars */
import React from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();
  return (
    <div style={{
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      height: "100vh", 
      width: "100%", 
      maxWidth: "600px", 
      margin: "auto", 
      textAlign: "center", 
      padding: "24px", 
      backgroundColor: "#f5f5f5"
    }}>
      <div style={{ fontSize: "32px", fontWeight: "bold", color: "#1976d2", marginBottom: "24px" }}>
        Manage Your Food Waste
      </div>
      <div style={{
        display: "flex", 
        flexDirection: "column", 
        gap: "24px", 
        padding: "24px", 
        borderRadius: "12px", 
        boxShadow: "0px 4px 10px rgba(0,0,0,0.1)", 
        backgroundColor: "white", 
        width: "100%", 
        maxWidth: "400px"
      }}>
        <div style={{ fontSize: "18px", color: "#333333" }}>
          Keep track of the food you buy and minimize waste with our easy-to-use tool.
        </div>
        <Button
          variant="contained"
          style={{ backgroundColor: "#1976d2", color: "white" }}
          onClick={() => navigate("/auth/login")}
        >
          Login
        </Button>
        <Button
          variant="contained"
          style={{ backgroundColor: "#2e7d32", color: "white" }}
          onClick={() => navigate("/auth/register")}
        >
          Register
        </Button>
        <div style={{ display:'flex', justifyContent:'space-between', width:'100%' }}>
          <Button
            variant="text"
            style={{ color: "#1976d2" }}
            onClick={() => navigate("/terms")}
          >
            Terms & Conditions
          </Button>
          <Button
            variant="text"
            style={{ color: "#6b7280" }}
            onClick={() => navigate("/privacy")}
          >
            Privacy
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
