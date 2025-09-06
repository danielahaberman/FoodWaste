// @ts-nocheck
import React, { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  IconButton,
} from "@mui/material";
import {
  Checklist as ChecklistIcon,
  EmojiEvents as TrophyIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import DailyTasks from "../DailyTasks";
import Leaderboard from "./Leaderboard";

const TasksAndLeaderboard = ({ onClose }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ 
      height: "100vh", 
      display: "flex", 
      flexDirection: "column",
      backgroundColor: "white",
      overflow: "hidden"
    }}>
      {/* Header */}
      <Box sx={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        p: { xs: 2, sm: 3 },
        borderBottom: "1px solid",
        borderColor: "divider",
        flexShrink: 0
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: "bold", 
            color: "primary.main",
            fontSize: { xs: "1.5rem", sm: "2rem" }
          }}
        >
          Tasks & Leaderboard
        </Typography>
        {onClose && (
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Tabs */}
      <Paper sx={{ 
        mb: 0, 
        borderRadius: 0,
        flexShrink: 0
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
        px: { xs: 1, sm: 2 }
      }}>
        {tabValue === 0 && (
          <DailyTasks showCloseButton={false} />
        )}
        {tabValue === 1 && (
          <Leaderboard />
        )}
      </Box>
    </Box>
  );
};

export default TasksAndLeaderboard;
