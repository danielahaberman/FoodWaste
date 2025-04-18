// @ts-nocheck
 
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, {useEffect, useState} from "react";
import PageLayout from "../PageLayout";
import { Paper, Button } from "@mui/material";
import axios from "axios";
import Survey from "../Survey";
function QaPage({setShowSurvey}){
const [surveyQuestions, setSurveyQuestions] = useState(null)


const fetchSurveyQuestions = async (stage) => {
    try {
      const response = await axios.get("http://localhost:5001/survey-questions", {
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



    return(
    <Paper
        style={{
          position: "absolute",
          height: "100vh",
          top: 0,
          left: 0,
          width: "100vw",
          zIndex: 10,
        }}
      >
         <Button onClick={(e)=>{
         setShowSurvey(false)
        }}>back</Button>
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