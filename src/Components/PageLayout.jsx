/* eslint-disable react/prop-types */
import React from "react";

function PageLayout({children, backgroundColor = "white"}){
    return(
        <div style={{
            width: "100%", 
            height: "100vh",
            maxWidth: "600px",
            margin: "0 auto",
            position: "relative",
            backgroundColor: backgroundColor,
            overflow: "hidden",
            boxSizing: "border-box"
        }}>
            {children}
        </div>
    )
}

export default PageLayout