// @ts-nocheck
/* eslint-disable react/prop-types */
import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import {
  Restaurant as RestaurantIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Logout as LogoutIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils/authUtils";

function BottomBar({ setShowConsumeWaste, setLoggingPurchase, setShowSurvey }) {
  const navigate = useNavigate();

  const NavItem = ({ icon, label, onClick, color }) => (
    <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
      <IconButton onClick={onClick} size="large" sx={{ color }} aria-label={label}>
        {icon}
      </IconButton>
      <Typography variant="caption" sx={{ color: "text.secondary", lineHeight: 1 }}>
        {label}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        boxSizing: "border-box",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: "600px",
        mx: "auto",
        px: 1.5,
        pt: 0.5,
        pb: `calc(8px + env(safe-area-inset-bottom))`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: 68,
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        borderTop: 1,
        borderColor: "divider",
        boxShadow: "0 -6px 18px rgba(0,0,0,0.08)",
        zIndex: 5,
      }}
    >
      <NavItem
        icon={
          <Box display="flex" alignItems="center" gap={0.5}>
            <RestaurantIcon />
            <DeleteIcon fontSize="small" />
          </Box>
        }
        label="Consume/Waste"
        onClick={() => setShowConsumeWaste(true)}
        color="primary.main"
      />


      <NavItem
        icon={<AssignmentIcon />}
        label="Survey"
        onClick={() => setShowSurvey(true)}
        color="primary.main"
      />

      {/* Terms link removed from bottom bar to de-emphasize */}

      <NavItem
        icon={<LogoutIcon />}
        label="Logout"
        onClick={() => {
          logout();
          navigate("/");
        }}
        color="error.main"
      />
    </Box>
  );
}

export default BottomBar;
