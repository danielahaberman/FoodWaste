// @ts-nocheck
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Stack,
  CircularProgress,
} from "@mui/material";

const Survey = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({}); // object keyed by questionId

  // const [initialCompleted, setInitialCompleted] = useState(false);
  // const [lastWeeklyCompletion, setLastWeeklyCompletion] = useState(null);
  // const [loadingStatus, setLoadingStatus] = useState(true);
  // const [errorStatus, setErrorStatus] = useState(null);

  // const userId = 1; // Replace with real user ID

  // // Fetch user survey completion status on mount
  // useEffect(() => {
  //   const fetchSurveyStatus = async () => {
  //     try {
  //       setLoadingStatus(true);
  //       const res = await axios.get(`http://localhost:5001/api/surveys/status/${userId}`);
  //       setInitialCompleted(res.data.initialCompleted);
  //       setLastWeeklyCompletion(res.data.lastWeeklyCompletion);
  //       setErrorStatus(null);
  //     } catch (err) {
  //       console.error("Failed to load survey status:", err);
  //       setErrorStatus("Failed to load survey status.");
  //     } finally {
  //       setLoadingStatus(false);
  //     }
  //   };
  //   fetchSurveyStatus();
  // }, [userId]);

  const currentQuestion = questions[currentIndex];
  const currentQuestionId = currentQuestion.id;
  const currentResponse = responses[currentQuestionId];

  // For number inputs, just check if it's non-empty (handle 0 correctly)
  const isEmptyResponse =
    currentResponse === undefined ||
    currentResponse === null ||
    (typeof currentResponse === "string" && currentResponse.trim() === "");

  const submitResponse = async ({ questionId, response }) => {
    try {
      await axios.post("http://localhost:5001/survey-response", {
        userId: localStorage.getItem("userId"),
        questionId,
        response,
      });
    } catch (error) {
      console.error("Failed to save response:", error);
      alert("Failed to save response. Try again.");
    }
  };

  const handleNext = async () => {
    const currentQuestionId = questions[currentIndex].id;
    const response = responses[currentQuestionId];

    if (response !== undefined && response !== null) {
      await submitResponse({ questionId: currentQuestionId, response });
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      alert("Survey complete!");
      console.log("Final Responses:", responses);
    }
  };

  const handleResponse = (response) => {
    const questionId = questions[currentIndex].id;
    setResponses((prev) => ({
      ...prev,
      [questionId]: response,
    }));
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const renderQuestion = (question) => {
    const questionId = questions[currentIndex].id;
    const currentResponse = responses[questionId] ?? "";

    switch (question.type) {
      case "multiple_choice":
      case "rating":
        return (
          <Stack spacing={2}>
            <Typography variant="h6">{question.question}</Typography>
            {question.options.map((option, idx) => {
              const isSelected = currentResponse === option.text;
              return (
                <Button
                  key={idx}
                  variant={isSelected ? "contained" : "outlined"}
                  color={isSelected ? "primary" : "inherit"}
                  onClick={() => handleResponse(option.text)}
                >
                  {option.text}
                </Button>
              );
            })}
          </Stack>
        );
      case "number":
      case "text":
        return (
          <Stack spacing={2}>
            <Typography variant="h6">{question.question}</Typography>
            <TextField
              type={question.type}
              fullWidth
              variant="outlined"
              value={currentResponse || ""}
              onChange={(e) => handleResponse(e.target.value)}
              placeholder={`Enter ${question.type}`}
            />
          </Stack>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      maxWidth={600}
      margin="auto"
      padding={4}
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <Typography variant="h4" gutterBottom>
        📝 Survey
      </Typography>

    

      <Paper elevation={3} sx={{ padding: 4, width: "100%" }}>
        {renderQuestion(currentQuestion)}

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mt={4}
        >
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={currentIndex === 0}
          >
            ⬅ Back
          </Button>
          <Typography variant="body2">
            Question {currentIndex + 1} of {questions.length}
          </Typography>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={isEmptyResponse}
          >
            {currentIndex < questions.length - 1 ? "Next ➡" : "Finish ✅"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Survey;
