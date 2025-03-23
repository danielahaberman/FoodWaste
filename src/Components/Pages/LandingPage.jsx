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
      backgroundColor: "#FF9F43"
    }}>
      <div style={{ fontSize: "32px", fontWeight: "bold", color: "#F2F3F4", marginBottom: "24px" }}>
        Manage Your Food Waste
      </div>
      <div style={{
        display: "flex", 
        flexDirection: "column", 
        gap: "24px", 
        padding: "24px", 
        borderRadius: "12px", 
        boxShadow: "0px 4px 10px rgba(0,0,0,0.1)", 
        backgroundColor: "#FFB37A", 
        width: "100%", 
        maxWidth: "400px"
      }}>
        <div style={{ fontSize: "18px", color: "#000000" }}>
          Keep track of the food you buy and minimize waste with our easy-to-use tool.
        </div>
        <Button
          variant="contained"
          style={{ backgroundColor: "#01796F", color: "#F2F3F4" }}
          onClick={() => navigate("/auth/login")}
        >
          Login
        </Button>
        <Button
          variant="contained"
          style={{ backgroundColor: "#50C878", color: "#000000" }}
          onClick={() => navigate("/auth/register")}
        >
          Register
        </Button>
      </div>
    </div>
  );
}

export default LandingPage;
