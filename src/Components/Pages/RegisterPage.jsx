// @ts-nocheck
/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import PageLayout from "../PageLayout";
import { TextField, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate()
  
  

  const handleRegister = async () => {
    try {
      const response = await fetch("http://localhost:5001/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, name }),
      });

      const data = await response.json();
      if (response.ok) {
        setError("");
        console.log("User registered successfully:", data);
        navigate("/login")
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("An error occurred");
    }
  };

  return (
    <PageLayout backgroundColor={"#f7be81"}>
      <div
        style={{
          fontSize: "20px",
          width: "fit-content",
          marginLeft: "auto",
          marginRight: "auto",
          fontWeight: "bold",
          fontFamily: "cursive",
        }}
      >
        Register
      </div>

      <div
        style={{
          border: "1px solid black",
          width: "80vw",
          height: "fit-content",
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
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
           <TextField
            type="name"
            label="name"
            variant="standard"
            placeholder="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            type="password"
            label="Password"
            variant="standard"
            placeholder="Password"
            value={password}
            onChange={(e) => {

                setPassword(e.target.value)
            }}
          />
          
          <Button disabled={!username || !password || !name} variant="contained" color="primary" onClick={handleRegister}>
            Register
          </Button>
          <Button variant="standard" color="primary" onClick={()=>{
            navigate("/")
          }}>
            back
          </Button>
        </div>
      </div>

      {error && <div style={{ color: "red" }}>{error}</div>}
    </PageLayout>
  );
}

export default RegisterPage;
