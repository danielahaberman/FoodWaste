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
          height: "100vh",
          width: "100%",
          backgroundColor: "#f5f5f5",
          overflow: "hidden",
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
            pb: 9, // Space for bottom bar
            backgroundColor: "#ffffff",
            borderRadius: 2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            overflow: "hidden",
            height: "100%",
          }}
        >
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              width: "100%",
              height: "100%",
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
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
