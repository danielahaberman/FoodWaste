// @ts-nocheck
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { foodPurchaseAPI, surveyAPI } from "../../api";
// MUI components
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { IconButton, Paper, Button, Box, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCurrentUserId } from "../../utils/authUtils";

import RestaurantIcon from '@mui/icons-material/Restaurant';
import DeleteIcon from '@mui/icons-material/Delete';
// Local components
import AddNewPurchase from "./AddNewPurchase";
import DateNavigator from "../DateNavigator";
import FoodPurchaseList from "../FoodPurchaseList";
import PageWrapper from "../PageWrapper";
import DailyTasksPopup from "../DailyTasksPopup";
import { Container } from "@mui/material";

const FoodLog = () => {
  const [foodPurchases, setFoodPurchases] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loggingPurchase, setLoggingPurchase] = useState(false);
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState(
    dateParam ? dayjs(dateParam, 'YYYY-MM-DD') : dayjs()
  );
  const [showDailyTasksPopup, setShowDailyTasksPopup] = useState(false);
  const navigate = useNavigate();


  // Extract unique dates with food purchases
  const datesWithFood = [...new Set(
    foodPurchases.map(purchase => dayjs(purchase.purchase_date).format('YYYY-MM-DD'))
  )];
  const fetchFoodItems = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;
    
    try {
      const params = { user_id: userId };
      const response = await foodPurchaseAPI.getFoodItems(params);
      setFoodItems(response.data || []);
    } catch (error) {
      console.error("Error fetching food items:", error);
    }
  };
   const fetchFoodPurchases = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;
    
    try {
      const params = { user_id: userId };
      const response = await foodPurchaseAPI.getFoodPurchases(params);
      setFoodPurchases(response.data || []);
    } catch (error) {
      console.error("Error fetching food purchases:", error);
    }
  };
const deletePurchase = async (purchaseId) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  
  try {
    // Send DELETE request with user_id as query param
    const response = await foodPurchaseAPI.deletePurchase(purchaseId, { user_id: userId });
    console.log("Delete purchase response:", response.data);
    fetchFoodPurchases()
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
        try {
          const userId = getCurrentUserId();
          if (!userId) return;
          
          // Check if popup was dismissed within the last 10 minutes
          const dismissTime = localStorage.getItem(`dailyTasksPopupDismissed_${userId}`);
          if (dismissTime) {
            const dismissTimestamp = parseInt(dismissTime, 10);
            const now = Date.now();
            const tenMinutesInMs = 10 * 60 * 1000; // 10 minutes in milliseconds
            
            if (now - dismissTimestamp < tenMinutesInMs) {
              // Popup was dismissed less than 10 minutes ago, don't show it
              return;
            }
          }
          
          // First check if weekly survey is due - if so, don't show daily tasks popup
          const surveyResponse = await surveyAPI.getSurveyStatus(userId);
          if (surveyResponse.data.weeklyDue) {
            // Weekly survey is required, don't show daily tasks popup
            return;
          }
          
          // Don't show daily tasks popup if welcome modal is showing (initial survey not completed)
          if (!surveyResponse.data.initialCompleted) {
            // Welcome modal is showing, don't show daily tasks popup
            return;
          }
          
          // Check if user has incomplete tasks
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/daily-tasks/today?user_id=${userId}`);
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
    <PageWrapper 
      title="Food Log" 
      maxWidth="sm"
      showLogo={true}
    >
      <Container 
        maxWidth="sm"
        sx={{ 
          maxWidth: { xs: '100%', sm: '600px' },
          px: { xs: 2, sm: 2.5 },
          py: { xs: 2.5, sm: 3 },
          pb: 0 // PageWrapper handles bottom padding for nav bar
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            gap: 1,
            mb: 2
          }}>
            <DateNavigator value={selectedDate} onChange={setSelectedDate} datesWithFood={datesWithFood} />
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
                mb: 2,
                display: 'block'
              }}
            >
              View only - can only add/delete food for the past 7 days
            </Typography>
          )}
        </LocalizationProvider>

        <Box sx={{ 
          mt: 2
        }}>
          {filteredPurchases.length > 0 ? (
            <FoodPurchaseList 
              deletePurchase={deletePurchase} 
              purchases={filteredPurchases} 
              canModify={canModify}
            />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh", color: "text.secondary", gap: 1 }}>
              <RestaurantIcon sx={{ fontSize: 40, opacity: 0.6 }} />
              <Box component="span" sx={{ fontStyle: "italic" }}>
                No foods logged for {selectedDate.format('MMMM D, YYYY')} yet.
              </Box>
            </Box>
          )}
        </Box>

        {loggingPurchase && (
          <Paper
            style={{
              position: "fixed",
              height: "100vh",
              top: "0vh",
              width: "100vw",
              maxWidth:"600px",
              zIndex: 1500,
              boxSizing:"border-box",
              left:"50%",
              transform: "translateX(-50%)",
              backgroundColor: "#fafafa"
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

        {/* Daily Tasks Popup */}
        {showDailyTasksPopup && (
          <DailyTasksPopup
            open={showDailyTasksPopup}
            onClose={() => setShowDailyTasksPopup(false)}
            onViewAllTasks={() => {
              setShowDailyTasksPopup(false);
              navigate("/tasks");
            }}
          />
        )}
      </Container>
    </PageWrapper>
  );
};

export default FoodLog;
