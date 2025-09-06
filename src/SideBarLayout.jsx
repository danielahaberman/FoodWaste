// @ts-nocheck
import React from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

const SidebarLayout = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        backgroundColor: { xs: "transparent", sm: "#f5f5f5" },
        overflow: "hidden",
        margin: 0,
        padding: 0,
        // Remove PageLayout wrapper on mobile to eliminate any margins
        position: { xs: "absolute", sm: "relative" },
        top: { xs: 0, sm: "auto" },
        left: { xs: 0, sm: "auto" },
        right: { xs: 0, sm: "auto" },
        bottom: { xs: 0, sm: "auto" },
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          width: { xs: "100%", sm: "100%" },
          maxWidth: { xs: "100%", sm: "600px" },
          margin: { xs: 0, sm: "0 auto" },
          px: { xs: 0, sm: 2 }, // No padding on mobile, padding on larger screens
          pt: { xs: 0, sm: 3 }, // No top padding on mobile, normal padding on larger screens
          pb: { xs: 8, sm: 9 }, // Space for bottom bar
          backgroundColor: "#ffffff",
          borderRadius: { xs: 0, sm: 2 }, // No border radius on mobile
          boxShadow: { xs: "none", sm: "0 2px 8px rgba(0,0,0,0.05)" }, // No shadow on mobile
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
      </Box>
    </Box>
  );
};

export default SidebarLayout;