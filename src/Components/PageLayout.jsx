/* eslint-disable react/prop-types */
import React from "react";




function PageLayout({children, backgroundColor = "white"}){



    return(<div style={{maxWidth:"600px", width: "100%",  marginLeft:"auto", marginRight:"auto", position:"relative",
            height: "100dvh", backgroundColor: backgroundColor}}>
            {children}
            </div>)
}

export default PageLayout