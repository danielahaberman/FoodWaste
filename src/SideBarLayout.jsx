// @ts-nocheck
import React from "react";
import { Box, Container } from "@mui/material";
import { Outlet } from "react-router-dom";
import PageLayout from "./Components/PageLayout";

const SidebarLayout = () => {
  return (
    <PageLayout>
     <Box
  sx={{
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: "#f5f5f5", // Light gray, looks like MUI
  }}
>
  <Container
    maxWidth="sm"
    sx={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      px: 2,
      pt: 3,
      backgroundColor: "#ffffff", // White container surface
      borderRadius: 2,
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)", // Subtle card feel
    }}
  >
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        width: "100%",
        maxWidth: "100%",
        mx: "auto",
      }}
    >
      <Outlet />
    </Box>
  </Container>
</Box>

    </PageLayout>
  );
};

export default SidebarLayout;
