import React from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";


function LandingPage(){

const navigate = useNavigate()


    return (<div><Button onClick={()=>{
        navigate("/login")
    }} >Login</Button></div>)
}


export default LandingPage