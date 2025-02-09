import React from "react";
import PageLayout from "../PageLayout";
import { TextField } from "@mui/material";


function LoginPage(){




    return (<PageLayout backgroundColor={"#f7be81"}>

<div style={{fontSize:"20px", width:"fit-content", marginLeft:"auto", marginRight: "auto", fontWeight:"bold", fontFamily: "cursive"}}>Login</div>
            <div style={{border:"1px solid black", width:"80vw", height:"60vw", borderRadius:"8px", marginLeft:"auto", marginRight:"auto", display:"flex", justifyContent:"center"}}>
    <div style={{display:"flex",  gap:"20px", width: "200px", flexDirection:"column", justifyContent:"center", alignItems:"center"}}>
        <TextField label="username" variant="standard" placeholder="User Name"/>
            <TextField type="password" label="password" variant="standard" placeholder="User Name"/>
    </div>
    


</div>
<div>image</div>
    </PageLayout>)
}


export default LoginPage