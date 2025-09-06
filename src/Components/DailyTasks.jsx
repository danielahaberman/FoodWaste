// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Stack,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
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

const DailyTasks = ({ onClose, showCloseButton = true }) => {
  const navigate = useNavigate();
  const [dailyTasks, setDailyTasks] = useState(null);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

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
      
      // Show celebration if all tasks completed
      if (tasksResponse.data?.all_tasks_completed && !showCelebration) {
        setShowCelebration(true);
      }
    } catch (error) {
      console.error("Error fetching daily tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyTasks();
  }, []);

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
        navigate("/home");
        break;
      case "survey":
        navigate("/survey");
        break;
      case "consume_waste":
        // This will be handled by the parent component
        if (onClose) onClose();
        // Trigger the consume/waste modal
        window.dispatchEvent(new CustomEvent('openConsumeWaste'));
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

  const getProgressPercentage = () => {
    const completed = getTaskCompletionCount();
    return (completed / 3) * 100;
  };

  const tasks = [
    {
      id: "food",
      title: "Log your first food item",
      description: "Add at least one food item to your log today",
      icon: <FoodIcon />,
      completed: dailyTasks?.log_food_completed || false,
      buttonText: "Go",
      color: "primary",
    },
    {
      id: "survey",
      title: "Complete your survey",
      description: "Complete any available survey",
      icon: <SurveyIcon />,
      completed: dailyTasks?.complete_survey_completed || false,
      buttonText: "Go",
      color: "secondary",
    },
    {
      id: "consume_waste",
      title: "Log your consume/waste",
      description: "Track what you consumed or wasted today",
      icon: <WasteIcon />,
      completed: dailyTasks?.log_consume_waste_completed || false,
      buttonText: "Go",
      color: "success",
    },
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography>Loading daily tasks...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2 }, 
      maxWidth: 600, 
      mx: "auto",
      width: "100%"
    }}>
      {/* Header - only show if showCloseButton is true */}
      {showCloseButton && (
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
            Daily Tasks
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      )}

      {/* Streak Display */}
      <Paper sx={{ 
        p: { xs: 1, sm: 1.5 }, 
        mb: 2, 
        background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)" 
      }}>
        <Stack 
          direction="row" 
          alignItems="center" 
          spacing={{ xs: 1, sm: 1.5 }}
        >
          <FireIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: "white" }} />
          <Box>
            <Typography 
              variant="body1" 
              sx={{ 
                color: "white", 
                fontWeight: "bold",
                fontSize: { xs: "0.875rem", sm: "1rem" },
                lineHeight: 1.2
              }}
            >
              Current Streak: {streak?.current_streak || 0} day(s)
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: "white", 
                opacity: 0.9,
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                lineHeight: 1.2
              }}
            >
              Longest: {streak?.longest_streak || 0} day(s)
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Progress Bar */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          mb: 0.5,
          flexWrap: "wrap",
          gap: 1
        }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
          >
            Progress
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
          >
            {getTaskCompletionCount()}/3 tasks completed
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={getProgressPercentage()}
          sx={{ height: { xs: 4, sm: 6 }, borderRadius: 3 }}
        />
      </Box>

      {/* Tasks List */}
      <Stack spacing={{ xs: 1, sm: 1.5 }}>
        {tasks.map((task) => (
          <Card
            key={task.id}
            sx={{
              border: task.completed ? "2px solid #4caf50" : "1px solid #e0e0e0",
              backgroundColor: task.completed ? "#f8fff8" : "white",
            }}
          >
            <CardContent sx={{ p: { xs: 1, sm: 1.5 }, "&:last-child": { pb: { xs: 1, sm: 1.5 } } }}>
              <Stack 
                direction={{ xs: "column", sm: "row" }} 
                alignItems={{ xs: "flex-start", sm: "center" }} 
                spacing={{ xs: 1, sm: 1.5 }}
              >
                <Box sx={{ flex: 1, width: "100%" }}>
                  <Stack 
                    direction="row" 
                    alignItems="center" 
                    spacing={1}
                    sx={{ mb: 0.25 }}
                  >
                    <Box
                      sx={{
                        p: 0.25,
                        borderRadius: "50%",
                        backgroundColor: task.completed ? "#4caf50" : "#f5f5f5",
                        color: task.completed ? "white" : "text.secondary",
                        minWidth: 20,
                        minHeight: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}
                    >
                      {task.completed ? <CheckIcon sx={{ fontSize: 12 }} /> : React.cloneElement(task.icon, { sx: { fontSize: 12 } })}
                    </Box>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: "bold", 
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                        lineHeight: 1.2
                      }}
                    >
                      {task.title}
                    </Typography>
                  </Stack>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      lineHeight: 1.2
                    }}
                  >
                    {task.description}
                  </Typography>
                </Box>

                <Button
                  variant={task.completed ? "outlined" : "contained"}
                  color={task.completed ? "success" : task.color}
                  disabled={task.completed}
                  onClick={() => handleTaskNavigation(task.id)}
                  size="small"
                  sx={{ 
                    minWidth: { xs: "100%", sm: 100 },
                    width: { xs: "100%", sm: "auto" },
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                    py: { xs: 0.5, sm: 0.25 },
                    px: { xs: 1, sm: 1.5 },
                    height: { xs: 32, sm: 28 }
                  }}
                >
                  {task.completed ? "Completed" : task.buttonText}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Completion Message */}
      {dailyTasks?.all_tasks_completed && (
        <Paper sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          mt: 3, 
          backgroundColor: "#e8f5e8", 
          border: "1px solid #4caf50" 
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: "#2e7d32", 
              textAlign: "center", 
              fontWeight: "bold",
              fontSize: { xs: "1rem", sm: "1.25rem" }
            }}
          >
            🎉 All tasks completed! Great job maintaining your streak!
          </Typography>
        </Paper>
      )}

      {/* Celebration Dialog */}
      <Dialog open={showCelebration} onClose={() => setShowCelebration(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: "center", color: "primary.main" }}>
          🎉 Congratulations!
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            You've completed all your daily tasks!
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Your streak is now {streak?.current_streak || 0} day(s) long. Keep it up!
          </Typography>
          <FireIcon sx={{ fontSize: 48, color: "#ff6b35", mb: 2 }} />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button variant="contained" onClick={() => setShowCelebration(false)}>
            Awesome!
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DailyTasks;
