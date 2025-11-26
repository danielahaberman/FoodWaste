// @ts-nocheck
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { Box, IconButton, Typography, Badge } from "@mui/material";
import {
  Restaurant as RestaurantIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Checklist as ChecklistIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { dailyTasksAPI } from "../api";

function BottomBar() {
  const navigate = useNavigate();
  const location = useLocation();
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

  const NavItem = ({ icon, label, onClick, color, isActive, route, isMain }) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flex: 1,
        minWidth: 0,
        height: '100%',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.65rem',
          fontWeight: 500,
          color: isActive ? color : 'rgba(0, 0, 0, 0.5)',
          mb: 0.75,
          pb: 0.5,
          opacity: 0.8,
          textAlign: 'center',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          width: '100%',
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: { xs: 40, sm: 42 },
          width: '100%',
          mt: 0.25,
          position: 'relative',
        }}
      >
        <IconButton 
          onClick={onClick} 
          size="large" 
          sx={{ 
            color: isActive ? color : 'rgba(0, 0, 0, 0.6)',
            width: { xs: 48, sm: 52 },
            height: { xs: 48, sm: 52 },
            minWidth: { xs: 48, sm: 52 },
            minHeight: { xs: 48, sm: 52 },
            padding: 0,
            margin: 0,
            borderRadius: 2.5,
            backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'rgba(0, 0, 0, 0.02)',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:active': {
              transform: 'scale(0.92)',
              backgroundColor: isActive ? 'rgba(25, 118, 210, 0.15)' : 'rgba(0, 0, 0, 0.08)',
            },
            '& .MuiSvgIcon-root': {
              fontSize: { xs: '1.75rem', sm: '1.85rem' },
              width: '1em',
              height: '1em',
            }
          }} 
          aria-label={label}
        >
          {icon}
        </IconButton>
      </Box>
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
        pt: 0.5,
        pb: 1,
        px: { xs: 1, sm: 1.5 },
        display: "flex",
        justifyContent: "space-around",
        alignItems: "flex-start",
        minHeight: 88,
        height: 88,
        backdropFilter: "blur(40px) saturate(200%)",
        WebkitBackdropFilter: "blur(40px) saturate(200%)",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderTop: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.08), 0 -2px 6px rgba(0, 0, 0, 0.06)",
        zIndex: 1400, // Higher than PageWrapper (1300) to ensure it's always visible
      }}
    >
      <NavItem
        icon={<CalendarIcon />}
        label="Summary"
        onClick={() => navigate("/summary")}
        color="#1976d2"
        isActive={location.pathname === "/summary"}
        route="/summary"
      />

      <NavItem
        icon={<AssignmentIcon />}
        label="Survey"
        onClick={() => navigate("/survey")}
        color="#1976d2"
        isActive={location.pathname === "/survey"}
        route="/survey"
      />

      <NavItem
        icon={<RestaurantIcon />}
        label="Log"
        onClick={() => navigate("/log")}
        color="#1976d2"
        isActive={location.pathname === "/log"}
        route="/log"
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
        onClick={() => navigate("/tasks")}
        color="#1976d2"
        isActive={location.pathname === "/tasks"}
        route="/tasks"
      />

      <NavItem
        icon={<SettingsIcon />}
        label="Settings"
        onClick={() => navigate("/settings")}
        color="#1976d2"
        isActive={location.pathname === "/settings"}
        route="/settings"
      />
    </Box>
  );
}

export default BottomBar;
