// @ts-nocheck
/* eslint-disable react/prop-types */
import React from "react";
import { Box, IconButton, Typography, Badge, Paper } from "@mui/material";
import {
  Restaurant as RestaurantIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Checklist as ChecklistIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useSessionData } from "../hooks/useSessionData";
import { frostedBar } from "../themeStyles";
import { colors, primaryAlpha } from "../themeColors";

function BottomBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = useSessionData();
  const tasks = data?.todayTasks;

  const completed = (tasks?.log_food_completed ? 1 : 0)
    + (tasks?.complete_survey_completed ? 1 : 0)
    + (tasks?.log_consume_waste_completed ? 1 : 0);
  const showDailyTasksIndicator = tasks ? completed < 3 : false;

  const goTo = (path) => {
    if (location.pathname === path) return;
    navigate(path);
  };

  const NavItem = ({ icon, label, onClick, isActive, route, isMain }) => (
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
          color: isActive ? colors.primary : 'rgba(0, 0, 0, 0.5)',
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
            color: isActive ? colors.primary : 'rgba(0, 0, 0, 0.6)',
            width: { xs: 48, sm: 52 },
            height: { xs: 48, sm: 52 },
            minWidth: { xs: 48, sm: 52 },
            minHeight: { xs: 48, sm: 52 },
            padding: 0,
            margin: 0,
            borderRadius: 2.5,
            backgroundColor: isActive ? primaryAlpha(0.08) : 'rgba(0, 0, 0, 0.02)',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:active': {
              transform: 'scale(0.92)',
              backgroundColor: isActive ? primaryAlpha(0.15) : 'rgba(0, 0, 0, 0.08)',
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
    <Paper
      component="nav"
      elevation={0}
      square
      sx={{
        ...frostedBar,
        boxSizing: "border-box",
        flexShrink: 0,
        zIndex: 1100,
        width: "100%",
        pt: 0.5,
        pb: 'calc(8px + env(safe-area-inset-bottom, 0px))',
        px: { xs: 1, sm: 1.5 },
        display: "flex",
        justifyContent: "space-around",
        alignItems: "flex-start",
        minHeight: 'calc(88px + env(safe-area-inset-bottom, 0px))',
        borderRadius: 0,
      }}
    >
      <NavItem
        icon={<CalendarIcon />}
        label="Mark waste"
        onClick={() => goTo("/summary")}
        isActive={location.pathname === "/summary"}
        route="/summary"
      />

      <NavItem
        icon={<AssignmentIcon />}
        label="Survey"
        onClick={() => goTo("/survey")}
        isActive={location.pathname === "/survey" || location.pathname === "/survey-progress"}
        route="/survey"
      />

      <NavItem
        icon={<RestaurantIcon />}
        label="Log"
        onClick={() => goTo("/log")}
        isActive={location.pathname === "/log"}
        route="/log"
      />

      <NavItem
        icon={
          showDailyTasksIndicator ? (
            <Badge 
              badgeContent={`${completed}/3`} 
              color={completed === 3 ? "success" : "primary"}
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
        onClick={() => goTo("/tasks")}
        isActive={location.pathname === "/tasks"}
        route="/tasks"
      />

      <NavItem
        icon={<SettingsIcon />}
        label="Settings"
        onClick={() => goTo("/settings")}
        isActive={location.pathname === "/settings"}
        route="/settings"
      />
    </Paper>
  );
}

export default BottomBar;
