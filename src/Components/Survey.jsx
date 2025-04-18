// @ts-nocheck
/* eslint-disable react/prop-types */
import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Stack,
} from "@mui/material";

const Survey = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState([]);

  const handleResponse = (response) => {
    const updatedResponses = [...responses];
    updatedResponses[currentIndex] = {
      questionId: questions[currentIndex].id,
      response,
    };
    setResponses(updatedResponses);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      alert("Survey complete!");
      console.log("Final Responses:", responses);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const renderQuestion = (question) => {
    switch (question.type) {
      case "multiple_choice":
      case "rating":
        return (
          <Stack spacing={2}>
            <Typography variant="h6">{question.question}</Typography>
            {question.options.map((option, idx) => (
              <Button
                key={idx}
                variant="outlined"
                onClick={() => handleResponse(option.text)}
              >
                {option.text}
              </Button>
            ))}
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
              value={responses[currentIndex]?.response || ""}
              onChange={(e) => handleResponse(e.target.value)}
              placeholder={`Enter ${question.type}`}
            />
          </Stack>
        );
      default:
        return null;
    }
  };

  const currentQuestion = questions[currentIndex];

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

      <Paper elevation={3} sx={{ padding: 4, width: "100%", mt: 2 }}>
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
          <Button variant="contained" onClick={handleNext}>
            {currentIndex < questions.length - 1 ? "Next ➡" : "Finish ✅"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Survey;
