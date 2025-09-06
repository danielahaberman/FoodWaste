// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  EmojiEvents as TrophyIcon,
  LocalFireDepartment as FireIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { leaderboardAPI } from "../../api";

const Leaderboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [currentStreaks, setCurrentStreaks] = useState([]);
  const [longestStreaks, setLongestStreaks] = useState([]);
  const [totalCompletions, setTotalCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const userId = localStorage.getItem("userId");

  const fetchLeaderboardData = async (isPolling = false) => {
    try {
      if (!isPolling) {
        setLoading(true);
      }
      const [currentResponse, longestResponse, totalResponse] = await Promise.all([
        leaderboardAPI.getCurrentStreaks({ limit: 20 }),
        leaderboardAPI.getLongestStreaks({ limit: 20 }),
        leaderboardAPI.getTotalCompletions({ limit: 20 }),
      ]);
      
      setCurrentStreaks(currentResponse.data);
      setLongestStreaks(longestResponse.data);
      setTotalCompletions(totalResponse.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLeaderboardData();
    
    // Set up polling every 30 seconds
    const pollInterval = setInterval(() => {
      fetchLeaderboardData(true); // Pass true to indicate this is polling
    }, 30000); // 30 seconds
    
    // Cleanup interval on unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <TrophyIcon sx={{ color: "#ffd700", fontSize: 16 }} />; // Gold
      case 1:
        return <TrophyIcon sx={{ color: "#c0c0c0", fontSize: 16 }} />; // Silver
      case 2:
        return <TrophyIcon sx={{ color: "#cd7f32", fontSize: 16 }} />; // Bronze
      default:
        return <Typography variant="caption" sx={{ fontWeight: "bold", color: "text.secondary", fontSize: "0.7rem" }}>
          #{index + 1}
        </Typography>;
    }
  };

  const getRankColor = (index) => {
    switch (index) {
      case 0:
        return "#ffd700"; // Gold
      case 1:
        return "#c0c0c0"; // Silver
      case 2:
        return "#cd7f32"; // Bronze
      default:
        return "primary.main";
    }
  };

  const renderLeaderboardList = (data, valueKey, icon, unit = "") => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: { xs: 3, sm: 4 } }}>
          <CircularProgress />
        </Box>
      );
    }

    if (data.length === 0) {
      return (
        <Box sx={{ textAlign: "center", py: { xs: 3, sm: 4 }, px: { xs: 1, sm: 2 } }}>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
          >
            No data available yet. Start completing daily tasks to appear on the leaderboard!
          </Typography>
        </Box>
      );
    }

    return (
      <List sx={{ p: 0 }}>
        {data.map((user, index) => (
          <ListItem
            key={`${user.username}-${index}`}
            sx={{
              backgroundColor: user.user_id === parseInt(userId) ? "#e3f2fd" : "transparent",
              borderRadius: 1,
              mb: 0.25,
              border: user.user_id === parseInt(userId) ? "1px solid #2196f3" : "1px solid transparent",
              px: 1,
              py: 0.25,
              minHeight: 36,
            }}
          >
            <ListItemAvatar sx={{ minWidth: 28 }}>
              <Avatar
                sx={{
                  backgroundColor: getRankColor(index),
                  color: "white",
                  fontWeight: "bold",
                  width: 24,
                  height: 24,
                  fontSize: "0.7rem"
                }}
              >
                {getRankIcon(index)}
              </Avatar>
            </ListItemAvatar>
            
            <ListItemText
              sx={{ m: 0 }}
              primary={
                <Stack 
                  direction="row" 
                  alignItems="center" 
                  spacing={0.5}
                  sx={{ width: "100%" }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      flex: 1
                    }}
                  >
                    {user.username || "Anonymous"}
                  </Typography>
                  {user.user_id === parseInt(userId) && (
                    <Chip 
                      label="You" 
                      size="small" 
                      color="primary"
                      sx={{ 
                        fontSize: "0.65rem",
                        height: 16,
                        "& .MuiChip-label": {
                          px: 0.5
                        }
                      }}
                    />
                  )}
                  <Stack 
                    direction="row" 
                    alignItems="center" 
                    spacing={0.25}
                  >
                    {React.cloneElement(icon, { 
                      sx: { fontSize: 14 } 
                    })}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: "bold", 
                        color: "primary.main",
                        fontSize: "0.75rem"
                      }}
                    >
                      {user[valueKey]} {unit}
                    </Typography>
                  </Stack>
                </Stack>
              }
            />
          </ListItem>
        ))}
      </List>
    );
  };

  const tabPanels = [
    {
      label: "Current Streaks",
      icon: <FireIcon />,
      data: currentStreaks,
      valueKey: "current_streak",
      unit: "days",
    },
    {
      label: "Longest Streaks",
      icon: <TrophyIcon />,
      data: longestStreaks,
      valueKey: "longest_streak",
      unit: "days",
    },
    {
      label: "Total Completions",
      icon: <CheckIcon />,
      data: totalCompletions,
      valueKey: "total_completions",
      unit: "tasks",
    },
  ];

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2 }, 
      maxWidth: 800, 
      mx: "auto",
      width: "100%"
    }}>
      {/* Header */}
      <Box sx={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        mb: 3 
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: "bold", 
            color: "primary.main",
            fontSize: { xs: "1.5rem", sm: "2rem" }
          }}
        >
          🏆 Leaderboard
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Description */}
      <Paper sx={{ 
        p: { xs: 1, sm: 1.5 }, 
        mb: 2, 
        backgroundColor: "#f5f5f5" 
      }}>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            fontSize: { xs: "0.8rem", sm: "0.875rem" },
            lineHeight: 1.4
          }}
        >
          Compete with other users to see who can maintain the longest streaks and complete the most daily tasks!
        </Typography>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 1.5 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="fullWidth"
          sx={{
            "& .MuiTab-root": {
              minHeight: { xs: 44, sm: 56 },
              fontSize: { xs: "0.7rem", sm: "0.875rem" },
              py: { xs: 0.5, sm: 1 },
              px: { xs: 0.5, sm: 1 }
            },
          }}
        >
          {tabPanels.map((tab, index) => (
            <Tab
              key={index}
              label={
                <Stack 
                  direction={{ xs: "column", sm: "row" }} 
                  alignItems="center" 
                  spacing={{ xs: 0.25, sm: 0.5 }}
                >
                  {React.cloneElement(tab.icon, { 
                    sx: { fontSize: { xs: 14, sm: 18 } } 
                  })}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: "bold",
                      fontSize: { xs: "0.7rem", sm: "0.8rem" },
                      lineHeight: 1.2
                    }}
                  >
                    {tab.label}
                  </Typography>
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Paper sx={{ 
        minHeight: { xs: 250, sm: 350 },
        maxHeight: { xs: "60vh", sm: "70vh" },
        overflow: "auto"
      }}>
        {tabPanels.map((tab, index) => (
          <Box
            key={index}
            sx={{ 
              display: tabValue === index ? "block" : "none", 
              p: { xs: 0.5, sm: 1 } 
            }}
          >
            {renderLeaderboardList(tab.data, tab.valueKey, tab.icon, tab.unit)}
          </Box>
        ))}
      </Paper>

      {/* Footer */}
      <Box sx={{ 
        mt: { xs: 2, sm: 3 }, 
        textAlign: "center",
        px: { xs: 1, sm: 0 }
      }}>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            fontSize: { xs: "0.7rem", sm: "0.8rem" },
            lineHeight: 1.4
          }}
        >
          Leaderboard auto-updates every 30 seconds. Complete your daily tasks to climb the ranks!
        </Typography>
        {lastUpdated && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: "0.65rem", sm: "0.7rem" },
              display: "block",
              mt: 0.5
            }}
          >
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Leaderboard;
