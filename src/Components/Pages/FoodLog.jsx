// @ts-nocheck
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { foodPurchaseAPI } from "../../api";
// MUI components
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { IconButton, Paper,Button, Box } from "@mui/material";
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
const FoodLog = () => {
  const [foodPurchases, setFoodPurchases] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loggingPurchase, setLoggingPurchase] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [showSurvey, setShowSurvey] = useState(false)
  const [showConsumeWaste, setShowConsumeWaste] = useState(false)
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

  const filteredPurchases = foodPurchases.filter((purchase) =>
    dayjs(purchase.purchase_date).isSame(selectedDate, "day")
  );

  return (
    <div>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <DateNavigator value={selectedDate} onChange={setSelectedDate} />
          <Button variant="contained" size="small" onClick={() => setLoggingPurchase(true)}>
            Add
          </Button>
        </div>
      </LocalizationProvider>

      <div style={{ maxHeight: "80vh", overflow: "auto" }}>
        {filteredPurchases.length > 0 ? (
          <FoodPurchaseList deletePurchase={deletePurchase} purchases={filteredPurchases} />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh", color: "text.secondary", gap: 1 }}>
            <RestaurantIcon sx={{ fontSize: 40, opacity: 0.6 }} />
            <Box component="span" sx={{ fontStyle: "italic" }}>No foods logged for this day yet.</Box>
          </Box>
        )}
      </div>

      {/* Bottom bar with Add button */}
     
        <BottomBar setLoggingPurchase={setLoggingPurchase} setShowConsumeWaste={setShowConsumeWaste} setShowSurvey={setShowSurvey}/>

      {/* Modal-style Add Purchase UI */}
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
    </div>
  );
};

export default FoodLog;
