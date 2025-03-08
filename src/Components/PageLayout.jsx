/* eslint-disable react/prop-types */
import React from "react";




function PageLayout({children, backgroundColor}){



    return(<div style={{maxWidth:"600px", width: "100%",  marginLeft:"auto", marginRight:"auto", position:"relative",
            height: "100vh", padding:"20px", backgroundColor: backgroundColor}}>
            {children}
            </div>)
}

export default PageLayout