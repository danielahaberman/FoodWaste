// @ts-nocheck
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { foodPurchaseAPI } from "../../api";
// MUI components
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { IconButton, Paper, Button, Box, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from "react-router-dom";

import RestaurantIcon from '@mui/icons-material/Restaurant';
import DeleteIcon from '@mui/icons-material/Delete';
// Local components
import AddNewPurchase from "./AddNewPurchase";
import DateNavigator from "../DateNavigator";
import FoodPurchaseList from "../FoodPurchaseList";
import AssignmentIcon from '@mui/icons-material/Assignment';
import ConsumeWaste from "./ComsumeWaste";
import QaPage from "./QaPage";
import BottomBar from "../BottomBar";
// import FoodEmojiBackground from "../FoodEmojiBackground";
import DailyTasksPopup from "../DailyTasksPopup";
import TasksAndLeaderboard from "./TasksAndLeaderboard";
const FoodLog = () => {
  const [foodPurchases, setFoodPurchases] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loggingPurchase, setLoggingPurchase] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [showSurvey, setShowSurvey] = useState(false)
  const [showConsumeWaste, setShowConsumeWaste] = useState(false)
  const [showDailyTasksPopup, setShowDailyTasksPopup] = useState(false)
  const [showTasksAndLeaderboard, setShowTasksAndLeaderboard] = useState(false)
    const navigate = useNavigate();
  const fetchFoodItems = async () => {
    try {
      const params = { user_id: localStorage.getItem("userId") };
      const response = await foodPurchaseAPI.getFoodItems(params);
      setFoodItems(response.data);
    } catch (error) {
      console.error("Error fetching food items:", error);
    }
  };
   const fetchFoodPurchases = async () => {
    try {
      const params = { user_id: localStorage.getItem("userId") };
      const response = await foodPurchaseAPI.getFoodPurchases(params);
      setFoodPurchases(response.data);
    } catch (error) {
      console.error("Error fetching food purchases:", error);
    }
  };
const deletePurchase = async (purchaseId) => {
  try {
    const userId = localStorage.getItem("userId");
    // Send DELETE request with user_id as query param
    const response = await foodPurchaseAPI.deletePurchase(purchaseId, { user_id: userId });
    console.log("Delete purchase response:", response.data);
    fetchFoodPurchases()
    // Optionally, refresh your purchase list here if you have one:
    // await fetchPurchases();
  } catch (error) {
    console.error("Error deleting purchase:", error);
  }
};

 
 
  useEffect(() => {
    fetchFoodPurchases();
  }, []);

  // Check for daily tasks popup
  useEffect(() => {
    const checkDailyTasksPopup = async () => {
      const today = new Date().toDateString();
      const popupShownToday = localStorage.getItem(`dailyTasksPopup_${today}`);
      
      if (!popupShownToday) {
        // Check if user has incomplete tasks
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/daily-tasks/today?user_id=${localStorage.getItem("userId")}`);
          const tasks = await response.json();
          
          const completed = (tasks.log_food_completed ? 1 : 0) + 
                          (tasks.complete_survey_completed ? 1 : 0) + 
                          (tasks.log_consume_waste_completed ? 1 : 0);
          
          if (completed < 3) {
            setShowDailyTasksPopup(true);
          }
        } catch (error) {
          console.error("Error checking daily tasks:", error);
        }
      }
    };
    
    checkDailyTasksPopup();
  }, []);

  // Listen for consume/waste modal events
  useEffect(() => {
    const handleOpenConsumeWaste = () => {
      setShowConsumeWaste(true);
    };
    
    window.addEventListener('openConsumeWaste', handleOpenConsumeWaste);
    return () => window.removeEventListener('openConsumeWaste', handleOpenConsumeWaste);
  }, []);

  // Listen for task completion events
  useEffect(() => {
    const handleTaskCompleted = () => {
      // Refresh data and check if popup should be shown
      fetchFoodPurchases();
    };
    
    window.addEventListener('taskCompleted', handleTaskCompleted);
    return () => window.removeEventListener('taskCompleted', handleTaskCompleted);
  }, []);

  const filteredPurchases = foodPurchases.filter((purchase) => {
    // Parse the UTC date and compare with selected date in local timezone
    const purchaseDate = dayjs(purchase.purchase_date);
    return purchaseDate.isSame(selectedDate, "day");
  });

  // Debug logging can be removed once everything is working

  // Check if selected date is within 7 days (can add/delete)
  const isWithin7Days = dayjs().subtract(7, 'day').isSameOrBefore(selectedDate, 'day');
  const isDateInPast = selectedDate.isBefore(dayjs(), 'day');
  const isDateInFuture = selectedDate.isAfter(dayjs(), 'day');
  
  // Can only add/delete if within 7 days and not in future
  const canModify = isWithin7Days && !isDateInFuture;

  return (
    // <FoodEmojiBackground>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: 1,
          px: 2, // Add horizontal padding
          py: 1.5, // Add vertical padding
        }}>
          <DateNavigator value={selectedDate} onChange={setSelectedDate} />
          <Button 
            variant="contained" 
            size="small" 
            onClick={() => setLoggingPurchase(true)}
            disabled={!canModify}
            title={!canModify ? "Can only add food for the past 7 days" : "Add food for this date"}
          >
            Add
          </Button>
        </Box>
        {!canModify && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              textAlign: 'center', 
              fontStyle: 'italic',
              mt: 0.5 
            }}
          >
            View only - can only add/delete food for the past 7 days
          </Typography>
        )}
      </LocalizationProvider>

      <Box sx={{ flex: 1, overflow: "auto", pb: '88px', mt: 2 }}>
        {filteredPurchases.length > 0 ? (
          <FoodPurchaseList 
            deletePurchase={deletePurchase} 
            purchases={filteredPurchases} 
            canModify={canModify}
          />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh", color: "text.secondary", gap: 1 }}>
            <RestaurantIcon sx={{ fontSize: 40, opacity: 0.6 }} />
            <Box component="span" sx={{ fontStyle: "italic" }}>No foods logged for this day yet.</Box>
          </Box>
        )}
      </Box>

      <BottomBar 
        setLoggingPurchase={setLoggingPurchase} 
        setShowConsumeWaste={setShowConsumeWaste} 
        setShowSurvey={setShowSurvey}
        setShowTasksAndLeaderboard={setShowTasksAndLeaderboard}
      />

      {loggingPurchase && (
        <Paper
          style={{
            position: "absolute",
            height: "100vh",
            top: "0vh",
            width: "100vw",
            maxWidth:"600px",
            zIndex: 10,
            boxSizing:"border-box",
            left:"0"
          }}
        >
          <AddNewPurchase
            setLoggingPurchase={setLoggingPurchase}
            foodItems={foodItems}
            fetchFoodItems={fetchFoodItems}
            fetchFoodPurchases={fetchFoodPurchases}
            selectedDate={selectedDate}
          />
        </Paper>
      )}
       {showSurvey && (
   <QaPage setShowSurvey={setShowSurvey}/>
      )}
       {showConsumeWaste && (
         <ConsumeWaste
           handleBack={() => {
             setShowConsumeWaste(false);
           }}
           onGoToDate={(dateStr) => {
             setSelectedDate(dayjs(dateStr, 'MM/DD/YYYY'));
             setShowConsumeWaste(false);
           }}
         />
       )}

       {/* Daily Tasks Popup */}
       {showDailyTasksPopup && (
         <DailyTasksPopup
           open={showDailyTasksPopup}
           onClose={() => setShowDailyTasksPopup(false)}
           onViewAllTasks={() => {
             setShowDailyTasksPopup(false);
             setShowTasksAndLeaderboard(true);
           }}
         />
       )}

       {/* Tasks and Leaderboard Full View */}
       {showTasksAndLeaderboard && (
         <Paper
           style={{
             position: "absolute",
             height: "100vh",
             top: "0vh",
             width: "100vw",
             maxWidth: "600px",
             zIndex: 10,
             boxSizing: "border-box",
             left: "0",
             overflow: "auto"
           }}
         >
           <TasksAndLeaderboard onClose={() => setShowTasksAndLeaderboard(false)} />
         </Paper>
       )}
      </Box>
    // </FoodEmojiBackground>
  );
};

export default FoodLog;
