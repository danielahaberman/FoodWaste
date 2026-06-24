// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  EmojiEventsOutlined as TrophyIcon,
  LocalFireDepartment as FireIcon,
  TaskAlt as CheckIcon,
  Refresh as RefreshIcon,
  PersonOutline as PersonIcon,
} from "@mui/icons-material";
import { leaderboardAPI } from "../../api";
import { getCurrentUserId } from "../../utils/authUtils";

const cardSx = {
  borderRadius: 3,
  border: "none",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
  backgroundColor: "white",
};

const RANK_STYLES = {
  0: { bg: "linear-gradient(135deg, #ffd54f 0%, #ffb300 100%)", color: "#5d4037", label: "1st" },
  1: { bg: "linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)", color: "#424242", label: "2nd" },
  2: { bg: "linear-gradient(135deg, #ffcc80 0%, #ff9800 100%)", color: "#5d4037", label: "3rd" },
};

const TAB_ACCENTS = {
  0: { bg: "rgba(239, 108, 0, 0.12)", color: "#ef6c00", Icon: FireIcon },
  1: { bg: "rgba(255, 193, 7, 0.15)", color: "#f9a825", Icon: TrophyIcon },
  2: { bg: "rgba(46, 125, 50, 0.12)", color: "#2e7d32", Icon: CheckIcon },
};

const Leaderboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [currentStreaks, setCurrentStreaks] = useState([]);
  const [longestStreaks, setLongestStreaks] = useState([]);
  const [totalCompletions, setTotalCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [startY, setStartY] = useState(0);
  const scrollContainerRef = useRef(null);

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

  const handleTouchStart = (e) => {
    const container = scrollContainerRef.current;
    if (container && container.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling) return;

    const container = scrollContainerRef.current;
    if (container && container.scrollTop === 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY);
      setPullDistance(Math.min(distance, 80));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 50 && !refreshing) {
      handleRefresh();
    }
    setPullDistance(0);
    setIsPulling(false);
    setStartY(0);
  };

  useEffect(() => {
    fetchLeaderboardData();

    const pollInterval = setInterval(() => {
      fetchLeaderboardData(true);
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  const tabPanels = [
    {
      label: "Current",
      fullLabel: "Current streaks",
      data: currentStreaks,
      valueKey: "current_streak",
      unit: "days",
    },
    {
      label: "Longest",
      fullLabel: "Longest streaks",
      data: longestStreaks,
      valueKey: "longest_streak",
      unit: "days",
    },
    {
      label: "Total",
      fullLabel: "Total completions",
      data: totalCompletions,
      valueKey: "total_completions",
      unit: "tasks",
    },
  ];

  const activeTab = tabPanels[tabValue];
  const accent = TAB_ACCENTS[tabValue];
  const TabIcon = accent.Icon;
  const currentUserIdNum = getCurrentUserId()
    ? parseInt(getCurrentUserId(), 10)
    : null;

  const renderRankBadge = (index) => {
    const rank = RANK_STYLES[index];
    if (rank) {
      return (
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: rank.bg,
            color: rank.color,
            fontWeight: 700,
            fontSize: "0.75rem",
          }}
        >
          {rank.label}
        </Box>
      );
    }

    return (
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.05)",
          color: "text.secondary",
          fontWeight: 700,
          fontSize: "0.8rem",
        }}
      >
        {index + 1}
      </Box>
    );
  };

  const renderLeaderboardList = (data, valueKey, unit) => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={32} />
        </Box>
      );
    }

    if (data.length === 0) {
      return (
        <Paper
          elevation={0}
          sx={{
            ...cardSx,
            py: 5,
            px: 3,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              mx: "auto",
              mb: 2,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: accent.bg,
              color: accent.color,
            }}
          >
            <TabIcon sx={{ fontSize: 28 }} />
          </Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            No rankings yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            Complete your daily tasks to appear on the leaderboard.
          </Typography>
        </Paper>
      );
    }

    return (
      <Stack spacing={1}>
        {data.map((user, index) => {
          const isCurrentUser = user.user_id === currentUserIdNum;
          const value = user[valueKey];

          return (
            <Paper
              key={`${user.username}-${index}`}
              elevation={0}
              sx={{
                ...cardSx,
                p: 1.5,
                border: isCurrentUser
                  ? "1.5px solid rgba(25, 118, 210, 0.4)"
                  : "1.5px solid transparent",
                backgroundColor: isCurrentUser ? "#f3f8fd" : "white",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                {renderRankBadge(index)}

                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isCurrentUser
                      ? "rgba(25, 118, 210, 0.12)"
                      : "rgba(0, 0, 0, 0.05)",
                    color: isCurrentUser ? "primary.main" : "text.secondary",
                  }}
                >
                  <PersonIcon sx={{ fontSize: 22 }} />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                      variant="subtitle2"
                      noWrap
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.9rem",
                      }}
                    >
                      {user.username || "Anonymous"}
                    </Typography>
                    {isCurrentUser && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: "primary.main",
                          backgroundColor: "rgba(25, 118, 210, 0.1)",
                          px: 1,
                          py: 0.15,
                          borderRadius: 1,
                          flexShrink: 0,
                        }}
                      >
                        You
                      </Typography>
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {activeTab.fullLabel}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      lineHeight: 1.1,
                      color: index < 3 ? accent.color : "text.primary",
                      fontSize: "1.15rem",
                    }}
                  >
                    {value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {unit}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    );
  };

  return (
    <Box sx={{ px: { xs: 0, sm: 0.5 }, pb: 3, width: "100%" }}>
      {/* Category tabs */}
      <Box
        sx={{
          mb: 2,
          p: 0.5,
          borderRadius: 3,
          backgroundColor: "rgba(0, 0, 0, 0.04)",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="fullWidth"
          TabIndicatorProps={{ sx: { display: "none" } }}
          sx={{
            minHeight: 44,
            "& .MuiTabs-flexContainer": { gap: 0.5 },
            "& .MuiTab-root": {
              minHeight: 44,
              py: 1,
              px: 1,
              borderRadius: 2.5,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8125rem",
              color: "text.secondary",
              transition: "background-color 0.2s ease, color 0.2s ease",
              "&.Mui-selected": {
                color: "primary.main",
                backgroundColor: "white",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
              },
            },
          }}
        >
          {tabPanels.map((tab, index) => {
            const Icon = TAB_ACCENTS[index].Icon;
            return (
              <Tab
                key={tab.label}
                disableRipple
                icon={<Icon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={tab.label}
              />
            );
          })}
        </Tabs>
      </Box>

      {/* Summary header */}
      <Paper elevation={0} sx={{ ...cardSx, mb: 2, overflow: "hidden" }}>
        <Box
          sx={{
            px: 2.5,
            py: 2,
            background: "linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)",
            color: "white",
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                }}
              >
                <TabIcon sx={{ fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                  Leaderboard
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {activeTab.fullLabel}
                </Typography>
              </Box>
            </Stack>
            <Tooltip title="Refresh">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  color: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.25)" },
                }}
                aria-label="Refresh leaderboard"
              >
                {refreshing ? (
                  <CircularProgress size={22} sx={{ color: "white" }} />
                ) : (
                  <RefreshIcon />
                )}
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? "Loading rankings…"
              : `${activeTab.data.length} participant${activeTab.data.length === 1 ? "" : "s"}`}
            {lastUpdated && !loading && (
              <> · Updated {lastUpdated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</>
            )}
          </Typography>
        </Box>
      </Paper>

      {/* Rankings list */}
      <Box
        ref={scrollContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        sx={{ position: "relative" }}
      >
        {pullDistance > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: `${pullDistance}px`,
              mb: 1,
              borderRadius: 2,
              backgroundColor: "rgba(25, 118, 210, 0.06)",
            }}
          >
            <Typography
              variant="caption"
              color={pullDistance > 50 ? "primary" : "text.secondary"}
              fontWeight={pullDistance > 50 ? 600 : 400}
            >
              {pullDistance > 50 ? "Release to refresh" : "Pull to refresh"}
            </Typography>
          </Box>
        )}

        {renderLeaderboardList(activeTab.data, activeTab.valueKey, activeTab.unit)}
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", textAlign: "center", mt: 2.5, lineHeight: 1.5 }}
      >
        Rankings refresh automatically every 30 seconds.
      </Typography>
    </Box>
  );
};

export default Leaderboard;
