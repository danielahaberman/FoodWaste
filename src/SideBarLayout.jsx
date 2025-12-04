// @ts-nocheck
import React from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import BottomBar from "./Components/BottomBar";

const SidebarLayout = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        backgroundColor: { xs: "transparent", sm: "#f5f5f5" },
        overflow: "hidden", /* Prevent scrolling at layout level */
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
          pt: { 
            xs: `max(0px, env(safe-area-inset-top))`, // iOS safe area top padding on mobile
            sm: 3 
          },
          pb: { xs: 0, sm: 9 }, // No bottom padding on mobile for full height, padding on larger screens
          backgroundColor: "transparent", // Make transparent to allow background to show through
          borderRadius: { xs: 0, sm: 2 }, // No border radius on mobile
          boxShadow: { xs: "none", sm: "0 2px 8px rgba(0,0,0,0.05)" }, // No shadow on mobile
          overflow: "hidden", /* Prevent scrolling at container level */
          height: "100%",
        }}
      >
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: "100%",
            height: "100%",
            overflow: "hidden", /* Prevent scrolling - only child content areas scroll */
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Outlet />
        </Box>
      </Box>
      <BottomBar />
    </Box>
  );
};

export default SidebarLayout;