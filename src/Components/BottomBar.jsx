// @ts-nocheck
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { Box, IconButton, Typography, Badge } from "@mui/material";
import {
  Restaurant as RestaurantIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Logout as LogoutIcon,
  Description as DescriptionIcon,
  MenuBook as MenuBookIcon,
  Checklist as ChecklistIcon,
  EmojiEvents as TrophyIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils/authUtils";
import { dailyTasksAPI } from "../api";

function BottomBar({ setShowConsumeWaste, setLoggingPurchase, setShowSurvey, setShowTasksAndLeaderboard }) {
  const navigate = useNavigate();
  const [taskCompletionStatus, setTaskCompletionStatus] = useState({ completed: 0, total: 3 });
  const [showDailyTasksIndicator, setShowDailyTasksIndicator] = useState(false);

  const userId = localStorage.getItem("userId");

  const fetchTaskStatus = async () => {
    try {
      const response = await dailyTasksAPI.getTodayTasks({ user_id: userId });
      const tasks = response.data;
      
      let completed = 0;
      if (tasks.log_food_completed) completed++;
      if (tasks.complete_survey_completed) completed++;
      if (tasks.log_consume_waste_completed) completed++;
      
      setTaskCompletionStatus({ completed, total: 3 });
      
      // Show indicator if popup was already shown today OR user has incomplete tasks
      const today = new Date().toDateString();
      const popupShownToday = localStorage.getItem(`dailyTasksPopup_${today}`);
      setShowDailyTasksIndicator(popupShownToday || completed < 3);
    } catch (error) {
      console.error("Error fetching task status:", error);
    }
  };

  useEffect(() => {
    fetchTaskStatus();
    
    // Listen for task completion events
    const handleTaskUpdate = () => {
      fetchTaskStatus();
    };
    
    window.addEventListener('taskCompleted', handleTaskUpdate);
    return () => window.removeEventListener('taskCompleted', handleTaskUpdate);
  }, []);

  const NavItem = ({ icon, label, onClick, color }) => (
    <IconButton onClick={onClick} size="large" sx={{ color }} aria-label={label}>
      {icon}
    </IconButton>
  );

  return (
    <Box
      sx={{
        boxSizing: "border-box",
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: "600px",
        width: "100%",
        px: 1.5,
        pt: 0.5,
        pb: `calc(8px + env(safe-area-inset-bottom, 0))`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: 56,
        height: `calc(56px + env(safe-area-inset-bottom, 0))`,
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderTop: 1,
        borderColor: "#e0e0e0",
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

      <NavItem
        icon={<MenuBookIcon />}
        label="Resources"
        onClick={() => navigate("/resources")}
        color="primary.main"
      />

      <NavItem
        icon={
          showDailyTasksIndicator ? (
            <Badge 
              badgeContent={`${taskCompletionStatus.completed}/${taskCompletionStatus.total}`} 
              color={taskCompletionStatus.completed === taskCompletionStatus.total ? "success" : "primary"}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ChecklistIcon />
            </Badge>
          ) : (
            <ChecklistIcon />
          )
        }
        label="Tasks & Leaderboard"
        onClick={() => setShowTasksAndLeaderboard(true)}
        color={showDailyTasksIndicator && taskCompletionStatus.completed === taskCompletionStatus.total ? "success.main" : "primary.main"}
      />

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
