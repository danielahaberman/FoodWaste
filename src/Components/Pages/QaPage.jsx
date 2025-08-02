// @ts-nocheck
 
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, {useEffect, useState} from "react";
import PageLayout from "../PageLayout";

import axios from "axios";
import Survey from "../Survey";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Stack,
  CircularProgress,
} from "@mui/material";
function QaPage({setShowSurvey}){
const [surveyQuestions, setSurveyQuestions] = useState(null)
  const [initialCompleted, setInitialCompleted] = useState(false);
  const [lastWeeklyCompletion, setLastWeeklyCompletion] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
const API_URL = process.env.REACT_APP_API_URL;

fetch(`${API_URL}/food-items?user_id=123`)
  .then(res => res.json())
  .then(data => console.log(data));


const fetchSurveyQuestions = async (stage) => {
    try {
      const response = await axios.get(`${API_URL}/survey-questions`, {
        params: { stage },
      });
      setSurveyQuestions(response.data);
    } catch (error) {
      console.error("Error fetching survey questions:", error);
    }
  };
useEffect(() => {
    fetchSurveyQuestions("initial")
}, [])

useEffect(() => {
  console.log("ran")
  const fetchSurveyStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await axios.get(`${API_URL}/api/surveys/status/${localStorage.getItem("userId")}`);
      setInitialCompleted(res.data.initialCompleted);
      console.log("here")
      if(!res.data.initialCompleted){
        fetchSurveyQuestions("initial")
      }else{
        fetchSurveyQuestions("weekly")
      }
      setLastWeeklyCompletion(res.data.lastWeeklyCompletion);
      setErrorStatus(null);
    } catch (err) {
      console.error("Failed to load survey status:", err);
      setErrorStatus("Failed to load survey status.");
    } finally {
      setLoadingStatus(false);
    }
  };
  fetchSurveyStatus()
}, [localStorage.getItem("userId")]);

    return(
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
        <div>test</div>
         <Button onClick={(e)=>{
         setShowSurvey(false)
        }}>back</Button>
          <Paper elevation={3} sx={{ padding: 4, width: "100%", mt: 2, mb: 3, boxSizing:"border-box" }}>
        {loadingStatus ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={3}>
            <CircularProgress />
          </Box>
        ) : errorStatus ? (
          <Typography color="error">{errorStatus}</Typography>
        ) : (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Initial Questions Completed:{" "}
              {initialCompleted ? "✅ Yes" : "❌ No"}
            </Typography>
            <Typography variant="subtitle1">
              Last Weekly Completion:{" "}
              {lastWeeklyCompletion
                ? new Date(lastWeeklyCompletion).toLocaleDateString()
                : "Never"}
            </Typography>
          </>
        )}
      </Paper>
       {/* {surveyQuestions.map((e)=>{
        return(<div>
            {e.question}
        </div>)
       })} */}
       {surveyQuestions &&   <Survey questions={surveyQuestions}/>}
     
       
      </Paper>
       )
}

export default QaPage