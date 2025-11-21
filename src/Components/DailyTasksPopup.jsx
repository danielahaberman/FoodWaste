// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  IconButton,
  Card,
  CardContent,
  LinearProgress,
} from "@mui/material";
import {
  Restaurant as FoodIcon,
  Assignment as SurveyIcon,
  Delete as WasteIcon,
  LocalFireDepartment as FireIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { dailyTasksAPI } from "../api";

const DailyTasksPopup = ({ open, onClose, onViewAllTasks }) => {
  const navigate = useNavigate();
  const [dailyTasks, setDailyTasks] = useState(null);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  const fetchDailyTasks = async () => {
    try {
      setLoading(true);
      const [tasksResponse, streakResponse] = await Promise.all([
        dailyTasksAPI.getTodayTasks({ user_id: userId }),
        dailyTasksAPI.getStreak({ user_id: userId }),
      ]);
      
      setDailyTasks(tasksResponse.data);
      setStreak(streakResponse.data);
    } catch (error) {
      console.error("Error fetching daily tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDailyTasks();
    }
  }, [open]);

  // Listen for task completion events to refresh data
  useEffect(() => {
    const handleTaskCompleted = () => {
      fetchDailyTasks();
    };
    
    window.addEventListener('taskCompleted', handleTaskCompleted);
    return () => window.removeEventListener('taskCompleted', handleTaskCompleted);
  }, []);

  const handleTaskNavigation = (taskType) => {
    switch (taskType) {
      case "food":
        navigate("/log");
        onClose();
        break;
      case "survey":
        navigate("/survey");
        onClose();
        break;
      case "consume_waste":
        onClose();
        // Trigger the consume/waste modal
        window.dispatchEvent(new CustomEvent('openConsumeWaste'));
        break;
      default:
        break;
    }
  };

  const handleDismiss = async () => {
    try {
      // Save dismiss datetime to localStorage (10 minutes cooldown)
      const dismissTime = Date.now();
      localStorage.setItem(`dailyTasksPopupDismissed_${userId}`, dismissTime.toString());
      
      await dailyTasksAPI.markPopupShown({ user_id: userId });
      onClose();
    } catch (error) {
      console.error("Error marking popup as shown:", error);
      // Still save dismiss time even if API call fails
      const dismissTime = Date.now();
      localStorage.setItem(`dailyTasksPopupDismissed_${userId}`, dismissTime.toString());
      onClose();
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

  const getProgressPercentage = () => {
    const completed = getTaskCompletionCount();
    return (completed / 3) * 100;
  };

  const getIncompleteTasks = () => {
    if (!dailyTasks) return [];
    
    const tasks = [
      {
        id: "food",
        title: "Log daily food item",
        icon: <FoodIcon />,
        completed: dailyTasks.log_food_completed,
        buttonText: "Go",
        color: "primary",
      },
      {
        id: "survey",
        title: "Complete survey",
        icon: <SurveyIcon />,
        completed: dailyTasks.complete_survey_completed,
        buttonText: "Go",
        color: "secondary",
      },
      {
        id: "consume_waste",
        title: "Log waste",
        icon: <WasteIcon />,
        completed: dailyTasks.log_consume_waste_completed,
        buttonText: "Go",
        color: "success",
      },
    ];

    return tasks.filter(task => !task.completed);
  };

  if (loading) {
    return (
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            zIndex: 1501, // Higher than backdrop to ensure dialog content appears above
          }
        }}
        sx={{
          zIndex: 1500, // Higher than bottom nav (1400) to ensure it appears above
          '& .MuiBackdrop-root': {
            zIndex: 1499, // Backdrop should be below the dialog content
            backgroundColor: 'rgba(0, 0, 0, 0.3)', // Reduced opacity for less opaque background
          }
        }}
      >
        <DialogContent sx={{ textAlign: "center", py: 4 }}>
          <Typography>Loading daily tasks...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  const incompleteTasks = getIncompleteTasks();
  const completedCount = getTaskCompletionCount();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          zIndex: 1501, // Higher than backdrop to ensure dialog content appears above
        }
      }}
      sx={{
        zIndex: 1500, // Higher than bottom nav (1400) to ensure it appears above
        '& .MuiBackdrop-root': {
          zIndex: 1499, // Backdrop should be below the dialog content
          backgroundColor: 'rgba(0, 0, 0, 0.3)', // Reduced opacity for less opaque background
        }
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FireIcon sx={{ color: "#ff6b35" }} />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Daily Tasks
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {/* Streak Display */}
        <Box sx={{ mb: 2, py: 1, px: 2, backgroundColor: "#fff3e0", borderRadius: 2, border: "1px solid #ffb74d" }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FireIcon sx={{ color: "#ff6b35" }} />
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              Current Streak: {streak?.current_streak || 0} days
            </Typography>
          </Stack>
        </Box>

        {/* Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {completedCount}/3 tasks completed
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={getProgressPercentage()}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* Incomplete Tasks */}
        {incompleteTasks.length > 0 ? (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Complete these tasks to maintain your streak:
            </Typography>
            {incompleteTasks.map((task) => (
              <Card key={task.id} sx={{ border: "1px solid #e0e0e0" }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 0.5,
                        borderRadius: "50%",
                        backgroundColor: "#f5f5f5",
                        color: "text.secondary",
                      }}
                    >
                      {task.icon}
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {task.title}
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      color={task.color}
                      size="small"
                      onClick={() => handleTaskNavigation(task.id)}
                      sx={{ minWidth: 100 }}
                    >
                      {task.buttonText}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <CheckIcon sx={{ fontSize: 48, color: "#4caf50", mb: 1 }} />
            <Typography variant="h6" sx={{ color: "#2e7d32", fontWeight: "bold" }}>
              🎉 All tasks completed!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Great job maintaining your streak!
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
        <Button onClick={handleDismiss} color="inherit">
          Dismiss
        </Button>
        <Button onClick={onViewAllTasks} variant="contained">
          View All Tasks
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DailyTasksPopup;
