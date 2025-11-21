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
    <IconButton 
      onClick={onClick} 
      size="large" 
      sx={{ 
        color,
        width: { xs: 48, sm: 52 },
        height: { xs: 48, sm: 52 },
        borderRadius: 3,
        backgroundColor: 'transparent',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          transform: 'translateY(-2px)',
        },
        '&:active': {
          transform: 'translateY(0px) scale(0.95)',
        },
        '& .MuiSvgIcon-root': {
          fontSize: { xs: '1.5rem', sm: '1.6rem' }
        }
      }} 
      aria-label={label}
    >
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
        pt: 2,
        pb: `calc(14px + env(safe-area-inset-bottom, 0))`,
        pl: { xs: `calc(20px + env(safe-area-inset-left, 0))`, sm: `calc(24px + env(safe-area-inset-left, 0))` },
        pr: { xs: `calc(20px + env(safe-area-inset-right, 0))`, sm: `calc(24px + env(safe-area-inset-right, 0))` },
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: 68,
        height: `calc(68px + env(safe-area-inset-bottom, 0))`,
        backdropFilter: "blur(40px) saturate(200%)",
        WebkitBackdropFilter: "blur(40px) saturate(200%)",
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        borderTop: "0.5px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.05), 0 -1px 3px rgba(0, 0, 0, 0.08)",
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
