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
        height: "100dvh",
        minHeight: "100vh",
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: { xs: "transparent", sm: "#f5f5f5" },
        overflow: "hidden",
      }}
    >
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Outlet />
      </Box>
      <BottomBar />
    </Box>
  );
};

export default SidebarLayout;
