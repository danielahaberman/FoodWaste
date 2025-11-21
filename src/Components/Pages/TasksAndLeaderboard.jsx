// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import {
  Checklist as ChecklistIcon,
  EmojiEvents as TrophyIcon,
} from "@mui/icons-material";
import DailyTasks from "../DailyTasks";
import Leaderboard from "./Leaderboard";
import PageWrapper from "../PageWrapper";

const TasksAndLeaderboard = ({ onClose }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <PageWrapper 
      title="Tasks & Leaderboard"
      onClose={onClose}
      maxWidth="sm"
      headerColor="white"
      headerTextColor="primary.main"
    >
      <Box sx={{ 
        display: "flex", 
        flexDirection: "column",
        backgroundColor: "white",
        height: "100%"
      }}>
        {/* Tabs */}
        <Paper sx={{ 
          mb: 0, 
          borderRadius: 0,
          flexShrink: 0,
          elevation: 0,
          borderBottom: '0.5px solid rgba(0, 0, 0, 0.1)'
        }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              "& .MuiTab-root": {
                minHeight: { xs: 48, sm: 60 },
                fontSize: { xs: "0.875rem", sm: "1rem" },
                py: { xs: 1, sm: 1.5 }
              },
            }}
          >
            <Tab
              label={
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: { xs: 0.5, sm: 1 },
                  flexDirection: { xs: "column", sm: "row" }
                }}>
                  <ChecklistIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: "bold",
                      fontSize: { xs: "0.75rem", sm: "1rem" }
                    }}
                  >
                    Daily Tasks
                  </Typography>
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: { xs: 0.5, sm: 1 },
                  flexDirection: { xs: "column", sm: "row" }
                }}>
                  <TrophyIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: "bold",
                      fontSize: { xs: "0.75rem", sm: "1rem" }
                    }}
                  >
                    Leaderboard
                  </Typography>
                </Box>
              }
            />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box sx={{ 
          flex: 1, 
          overflow: "auto",
          px: { xs: 1, sm: 2 },
          pb: `calc(16px + env(safe-area-inset-bottom, 0))`
        }}>
          {tabValue === 0 && (
            <DailyTasks showCloseButton={false} />
          )}
          {tabValue === 1 && (
            <Leaderboard />
          )}
        </Box>
      </Box>
    </PageWrapper>
  );
};

export default TasksAndLeaderboard;
