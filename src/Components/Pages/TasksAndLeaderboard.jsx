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
import { useNavigate } from "react-router-dom";
import DailyTasks from "../DailyTasks";
import Leaderboard from "./Leaderboard";
import PageWrapper from "../PageWrapper";
import { frostedSurface } from "../../themeStyles";

const TasksAndLeaderboard = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <PageWrapper title="Tasks & Leaderboard">
      <Box sx={{ 
        display: "flex", 
        flexDirection: "column",
        height: "100%",
        width: "100%"
      }}>
        <Paper sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 998,
          mb: 0, 
          borderRadius: 0,
          flexShrink: 0,
          elevation: 0,
          ...frostedSurface,
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

        {/* Tab Content - Scrollable */}
        <Box sx={{ 
          flex: 1, 
          overflow: "auto",
          overflowX: "hidden",
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
