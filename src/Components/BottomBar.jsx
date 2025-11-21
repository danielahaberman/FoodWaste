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

  const NavItem = ({ icon, label, onClick, color, isActive }) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        minWidth: 0,
      }}
    >
      <IconButton 
        onClick={onClick} 
        size="large" 
        sx={{ 
          color: isActive ? color : 'rgba(0, 0, 0, 0.6)',
          width: { xs: 56, sm: 60 },
          height: { xs: 56, sm: 60 },
          borderRadius: 2.5,
          backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:active': {
            transform: 'scale(0.92)',
            backgroundColor: isActive ? 'rgba(25, 118, 210, 0.15)' : 'rgba(0, 0, 0, 0.08)',
          },
          '& .MuiSvgIcon-root': {
            fontSize: { xs: '1.75rem', sm: '1.85rem' },
          }
        }} 
        aria-label={label}
      >
        {icon}
      </IconButton>
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.65rem',
          fontWeight: 500,
          color: isActive ? color : 'rgba(0, 0, 0, 0.5)',
          mt: 0.25,
          opacity: 0.8,
        }}
      >
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
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: "600px",
        width: "100%",
        pt: 1.5,
        pb: `calc(12px + env(safe-area-inset-bottom, 0))`,
        px: { xs: 1, sm: 1.5 },
        display: "flex",
        justifyContent: "space-around",
        alignItems: "flex-start",
        minHeight: 72,
        height: `calc(72px + env(safe-area-inset-bottom, 0))`,
        backdropFilter: "blur(40px) saturate(200%)",
        WebkitBackdropFilter: "blur(40px) saturate(200%)",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderTop: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.08), 0 -2px 6px rgba(0, 0, 0, 0.06)",
        zIndex: 5,
      }}
    >
      <NavItem
        icon={<RestaurantIcon />}
        label="Log Food"
        onClick={() => setShowConsumeWaste(true)}
        color="#1976d2"
        isActive={false}
      />

      <NavItem
        icon={<AssignmentIcon />}
        label="Survey"
        onClick={() => setShowSurvey(true)}
        color="#1976d2"
        isActive={false}
      />

      <NavItem
        icon={<MenuBookIcon />}
        label="Resources"
        onClick={() => navigate("/resources")}
        color="#1976d2"
        isActive={false}
      />

      <NavItem
        icon={
          showDailyTasksIndicator ? (
            <Badge 
              badgeContent={`${taskCompletionStatus.completed}/${taskCompletionStatus.total}`} 
              color={taskCompletionStatus.completed === taskCompletionStatus.total ? "success" : "primary"}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  minWidth: '20px',
                  height: '18px',
                  borderRadius: '9px',
                  padding: '0 6px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                }
              }}
            >
              <ChecklistIcon />
            </Badge>
          ) : (
            <ChecklistIcon />
          )
        }
        label="Tasks"
        onClick={() => setShowTasksAndLeaderboard(true)}
        color={showDailyTasksIndicator && taskCompletionStatus.completed === taskCompletionStatus.total ? "#2e7d32" : "#1976d2"}
        isActive={showDailyTasksIndicator}
      />

      <NavItem
        icon={<LogoutIcon />}
        label="Logout"
        onClick={() => {
          logout();
          navigate("/");
        }}
        color="#d32f2f"
        isActive={false}
      />
    </Box>
  );
}

export default BottomBar;
