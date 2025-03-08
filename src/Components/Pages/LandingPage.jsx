/* eslint-disable no-unused-vars */
import React from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{display:"flex", flexDirection:"column", alignItems:"Center", justifyContent:"space-around", height:"100%",  width:"100%", maxWidth:"600px", marginLeft:"auto", marginRight:"auto", textAlign:"center"}}>
        <div style={{fontSize:"30px"}}>Manage Your Food Waste</div>
      <div style={{display:"flex", flexDirection:"column", gap:"30px"}}>
    <div>Here you will find an easy way to keep track of the food you buy and how much of it ends up in the trash</div>
      <Button onClick={() => {
        navigate("/login");
      }}>
        Login
      </Button>
      <Button onClick={() => {
        navigate("/register");
      }}>
        Register
      </Button>
      </div>
      
    </div>
  );
}

export default LandingPage;
