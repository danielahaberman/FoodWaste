// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Stack,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Restaurant as FoodIcon,
  Assignment as SurveyIcon,
  DeleteOutline as WasteIcon,
  LocalFireDepartment as FireIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useSessionData } from "../hooks/useSessionData";
import AppConfirmDialog from "./AppConfirmDialog";
import { colors, primaryAlpha, primaryGradientH } from "../themeColors";

const TASK_ACCENTS = {
  food: { bg: primaryAlpha(0.12), color: colors.primary, Icon: FoodIcon },
  survey: { bg: "rgba(103, 58, 183, 0.12)", color: "#673ab7", Icon: SurveyIcon },
  consume_waste: { bg: "rgba(46, 125, 50, 0.12)", color: "#2e7d32", Icon: WasteIcon },
};

const cardSx = {
  borderRadius: 3,
  border: "none",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
  backgroundColor: "white",
};

const DailyTasks = ({ onClose, showCloseButton = true }) => {
  const navigate = useNavigate();
  const { data, loading, refresh } = useSessionData();
  const dailyTasks = data?.todayTasks ?? null;
  const streak = data?.streak ?? null;
  const [showCelebration, setShowCelebration] = useState(false);
  const prevAllCompleteRef = useRef(null);

  useEffect(() => {
    if (!dailyTasks) return;

    const allComplete = !!dailyTasks.all_tasks_completed;
    const wasComplete = prevAllCompleteRef.current;
    if (wasComplete === false && allComplete) {
      setShowCelebration(true);
    }
    prevAllCompleteRef.current = allComplete;
  }, [dailyTasks]);

  const handleTaskNavigation = (taskType) => {
    switch (taskType) {
      case "food":
        navigate("/log");
        break;
      case "survey":
        navigate("/survey");
        break;
      case "consume_waste":
        navigate("/summary");
        if (onClose) onClose();
        break;
      default:
        break;
    }
  };

  const getTaskCompletionCount = () => {
    if (!dailyTasks) return 0;
    let count = 0;
    if (dailyTasks.log_food_completed) count++;
    if (dailyTasks.complete_survey_completed) count++;
    if (dailyTasks.log_consume_waste_completed) count++;
    return count;
  };

  const completedCount = getTaskCompletionCount();
  const progressPct = (completedCount / 3) * 100;

  const tasks = [
    {
      id: "food",
      title: "Log your first food item",
      description: "Add at least one food item to your log today",
      completed: dailyTasks?.log_food_completed || false,
    },
    {
      id: "survey",
      title: "Complete your survey",
      description: "Complete any available survey",
      completed: dailyTasks?.complete_survey_completed || false,
    },
    {
      id: "consume_waste",
      title: "Log your consume/waste",
      description: "Track what you consumed or wasted today",
      completed: dailyTasks?.log_consume_waste_completed || false,
    },
  ];

  return (
    <Box sx={{ px: { xs: 0, sm: 0.5 }, pb: 3, width: "100%" }}>
      {showCloseButton && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2.5,
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, letterSpacing: "-0.02em" }}
          >
            Daily Tasks
          </Typography>
          <IconButton onClick={onClose} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      {/* Streak + progress hero */}
      <Paper elevation={0} sx={{ ...cardSx, mb: 2.5, overflow: "hidden" }}>
        <Box
          sx={{
            px: 2.5,
            py: 2,
            backgroundColor: colors.primary,
            color: "white",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              }}
            >
              <FireIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                sx={{ opacity: 0.9, fontWeight: 500, mb: 0.25 }}
              >
                Your streak
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {streak?.current_streak || 0}{" "}
                {(streak?.current_streak || 0) === 1 ? "day" : "days"}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption" sx={{ opacity: 0.85, display: "block" }}>
                Best
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {streak?.longest_streak || 0} days
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="baseline"
            sx={{ mb: 1 }}
          >
            <Typography variant="body2" fontWeight={600} color="text.primary">
              Today&apos;s progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completedCount}/3 complete
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progressPct}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: primaryAlpha(0.12),
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                background: primaryGradientH,
              },
            }}
          />
        </Box>
      </Paper>

      {/* Task list */}
      {loading && !dailyTasks ? (
        <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
      <Stack spacing={1.5}>
        {tasks.map((task) => {
          const accent = TASK_ACCENTS[task.id];
          const TaskIcon = accent.Icon;

          return (
            <Paper
              key={task.id}
              elevation={0}
              onClick={
                task.completed ? undefined : () => handleTaskNavigation(task.id)
              }
              sx={{
                ...cardSx,
                p: 2,
                cursor: task.completed ? "default" : "pointer",
                transition: "box-shadow 0.2s ease, transform 0.15s ease",
                border: task.completed
                  ? "1.5px solid rgba(46, 125, 50, 0.35)"
                  : "1.5px solid transparent",
                backgroundColor: task.completed ? "#f6fbf6" : "white",
                ...(!task.completed && {
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                    transform: "translateY(-1px)",
                  },
                  "&:active": { transform: "translateY(0)" },
                }),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2.5,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: task.completed
                      ? "rgba(46, 125, 50, 0.15)"
                      : accent.bg,
                    color: task.completed ? "#2e7d32" : accent.color,
                  }}
                >
                  {task.completed ? (
                    <CheckIcon sx={{ fontSize: 26 }} />
                  ) : (
                    <TaskIcon sx={{ fontSize: 24 }} />
                  )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      lineHeight: 1.3,
                      color: task.completed ? "text.secondary" : "text.primary",
                      textDecoration: task.completed ? "line-through" : "none",
                    }}
                  >
                    {task.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.25, lineHeight: 1.4, fontSize: "0.8125rem" }}
                  >
                    {task.description}
                  </Typography>
                </Box>

                {!task.completed ? (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskNavigation(task.id);
                    }}
                    sx={{
                      flexShrink: 0,
                      backgroundColor: primaryAlpha(0.08),
                      color: "primary.main",
                      "&:hover": { backgroundColor: primaryAlpha(0.15) },
                    }}
                    aria-label={`Go to ${task.title}`}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                ) : (
                  <Typography
                    variant="caption"
                    sx={{
                      flexShrink: 0,
                      fontWeight: 600,
                      color: "success.main",
                      px: 1,
                    }}
                  >
                    Done
                  </Typography>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Stack>
      )}

      {dailyTasks?.all_tasks_completed && (
        <Paper
          elevation={0}
          sx={{
            ...cardSx,
            mt: 2.5,
            p: 2.5,
            textAlign: "center",
            backgroundColor: "#f1f8f1",
            border: "1.5px solid rgba(46, 125, 50, 0.25)",
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: "success.dark" }}
          >
            All done for today!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Great job keeping your streak alive.
          </Typography>
        </Paper>
      )}

      <AppConfirmDialog
        open={showCelebration}
        onClose={() => setShowCelebration(false)}
        presentation="centered"
        zIndex={1500}
        tone="success"
        icon={<FireIcon />}
        title="All tasks complete!"
        primaryAction={{
          label: "Awesome!",
          onClick: () => setShowCelebration(false),
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
          Your streak is now <strong>{streak?.current_streak || 0} days</strong>. Keep it up!
        </Typography>
      </AppConfirmDialog>
    </Box>
  );
};

export default DailyTasks;
