// @ts-nocheck
import React from "react";
import { Box, Container } from "@mui/material";
import { Outlet } from "react-router-dom";

import PageLayout from "./Components/PageLayout";


const SidebarLayout = () => {

  return (
    <PageLayout>
      <Container 
        maxWidth="sm" 
        sx={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          height: "100vh",
          position: "relative",
          backgroundColor: "#FFB37A", 
        }}
      >

        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3, 
            mt: 2, 
            width: "100%", 
            maxWidth: "600px", 
            textAlign: "center" 
          }}
        >
          <Outlet />
        </Box>
      
      </Container>
    </PageLayout>
  );
};

export default SidebarLayout;
