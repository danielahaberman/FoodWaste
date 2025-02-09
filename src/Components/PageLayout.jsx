import React from "react";




function PageLayout({children, backgroundColor}){



    return(<div style={{maxWidth:"600px", width: "100vw", 
            height: "100vh", padding:"20px", backgroundColor: backgroundColor}}>
            {children}
            </div>)
}

export default PageLayout