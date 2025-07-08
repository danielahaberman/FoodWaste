// @ts-nocheck
import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";

// MUI components
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { IconButton, Paper,Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DeleteIcon from '@mui/icons-material/Delete';
// Local components
import AddNewPurchase from "./AddNewPurchase";
import DateNavigator from "../DateNavigator";
import FoodPurchaseList from "../FoodPurchaseList";
import AssignmentIcon from '@mui/icons-material/Assignment';
import ConsumeWaste from "./ComsumeWaste";
import QaPage from "./QaPage";
const FoodLog = () => {
  const [foodPurchases, setFoodPurchases] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loggingPurchase, setLoggingPurchase] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [showSurvey, setShowSurvey] = useState(false)
  const [showConsumeWaste, setShowConsumeWaste] = useState(false)
  const API_URL = process.env.REACT_APP_API_URL;
  const fetchFoodItems = async () => {
    try {
      const params = { user_id: localStorage.getItem("userId") };
      const response = await axios.get(`${API_URL}/food-items`, { params });
      setFoodItems(response.data);
    } catch (error) {
      console.error("Error fetching food items:", error);
    }
  };

  const fetchFoodPurchases = async () => {
    try {
      const params = { user_id: localStorage.getItem("userId") };
      const response = await axios.get(`${API_URL}/food-purchases`, { params });
      setFoodPurchases(response.data);
    } catch (error) {
      console.error("Error fetching food purchases:", error);
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
        <DateNavigator value={selectedDate} onChange={setSelectedDate} />
      </LocalizationProvider>

      <div style={{ maxHeight: "80vh", overflow: "auto" }}>
        <FoodPurchaseList purchases={filteredPurchases} />
      </div>

      {/* Bottom bar with Add button */}
     
      <div
        style={{
          width: "100vw",
          maxWidth:"600px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "grey",
          height: "50px",
          position: "absolute",
          bottom: 0,
          left: 0,
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
        }}
      >
         <Button onClick={()=>{
       setShowConsumeWaste(true)
       }}>
       <RestaurantIcon/><div style={{fontSize:"25px"}}>/</div><DeleteIcon/>
       </Button>
        <IconButton
          onClick={() => setLoggingPurchase(true)}
          sx={{
            bgcolor: "darkorange",
            "&:hover": { bgcolor: "primary.dark" },
            color: "common.white",
          }}
        >
          <AddIcon />
        </IconButton>
       <Button onClick={()=>{
        setShowSurvey(true)
       }}>
      <AssignmentIcon/>
       </Button>
      </div>

      {/* Modal-style Add Purchase UI */}
      {loggingPurchase && (
        <Paper
          style={{
            position: "absolute",
            height: "100vh",
            top: 0,
            left: 0,
            width: "100%",
            zIndex: 10,
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
        <Paper
          style={{
            position: "absolute",
            height: "100vh",
            top: 0,
            left: 0,
            width: "100%",
            zIndex: 10,
          }}
        >
          <Button onClick={()=>{
            setShowConsumeWaste(false)
          }}>back</Button>
         consume/waste food page
         <ConsumeWaste/>
        </Paper>
      )}
    </div>
  );
};

export default FoodLog;
