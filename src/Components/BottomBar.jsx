// @ts-nocheck
/* eslint-disable react/prop-types */
import React from "react";
import { Box, Button, IconButton } from "@mui/material";
import {
  Restaurant as RestaurantIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

function BottomBar({ setShowConsumeWaste, setLoggingPurchase, setShowSurvey }) {
  const navigate = useNavigate();

  return (
    <Box
    style={{boxSizing:"border-box"}}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      maxWidth="600px"
      mx="auto"
      bgcolor="grey.300"
      borderTopLeftRadius={12}
      borderTopRightRadius={12}
      display="flex"
      justifyContent="space-around"
      alignItems="center"
      height={56}
      px={1}
      boxShadow={3}
      zIndex={5}
    >
      <Button
        onClick={() => setShowConsumeWaste(true)}
        startIcon={<RestaurantIcon />}
        endIcon={<DeleteIcon />}
        sx={{
          minWidth: 80,
          px: 1,
          textTransform: "none",
          fontWeight: "medium",
        }}
        aria-label="Consume or Waste Food"
      >
        {/* You can put some label here if you want, or keep empty */}
      </Button>

      <IconButton
        onClick={() => setLoggingPurchase(true)}
        size="large"
        sx={{
          bgcolor: "primary.main",
          color: "common.white",
          "&:hover": { bgcolor: "primary.dark" },
          boxShadow: 4,
          borderRadius: "50%",
          width: 56,
          height: 56,
          mx: 1,
        }}
        aria-label="Add New Purchase"
      >
        <AddIcon fontSize="large" />
      </IconButton>

      <IconButton
        onClick={() => setShowSurvey(true)}
        aria-label="Open Survey"
        size="large"
        color="primary"
      >
        <AssignmentIcon fontSize="large" />
      </IconButton>

      <IconButton
        onClick={() => {
          localStorage.removeItem("userId");
          navigate("/");
        }}
        aria-label="Logout"
        size="large"
        sx={{ color: "error.main" }}
      >
        <LogoutIcon fontSize="large" />
      </IconButton>
    </Box>
  );
}

export default BottomBar;
