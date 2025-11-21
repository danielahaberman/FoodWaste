// @ts-nocheck
/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { surveyAPI } from "../api";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

const Survey = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({}); // object keyed by questionId
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  
  const surveyTitle = questions[0]?.stage || 'Survey';
  const currentQuestion = questions[currentIndex];
  const currentQuestionId = currentQuestion?.id;
  const currentResponse = responses[currentQuestionId];

  // For number inputs, just check if it's non-empty (handle 0 correctly)
  const isEmptyResponse =
    currentResponse === undefined ||
    currentResponse === null ||
    (typeof currentResponse === "string" && currentResponse.trim() === "");

  const submitResponse = async ({ questionId, response }) => {
    try {
      await surveyAPI.submitSurveyResponse({
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
    const currentQuestionId = questions[currentIndex]?.id;
    const response = responses[currentQuestionId];

    if (response !== undefined && response !== null) {
      await submitResponse({ questionId: currentQuestionId, response });
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      console.log("Final Responses:", responses);
      setShowCompletionModal(true);
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

  const handleGoHome = () => {
    // Dispatch task completion event to update streak and task counts
    window.dispatchEvent(new CustomEvent('taskCompleted'));
    window.location.href = "/log";
  };

  const getCompletionMessage = () => {
    const stage = surveyTitle.toLowerCase();
    
    if (stage === 'weekly') {
      return {
        title: "🎉 Weekly Survey Complete!",
        message: "Thank you for completing this week's survey!",
        nextSteps: [
          "Your next weekly survey will be available in 7 days",
          "Keep tracking your food purchases and consumption in the meantime",
          "There will be a final closing survey at the end of the study period"
        ]
      };
    } else if (stage === 'initial') {
      return {
        title: "🎉 Initial Survey Complete!",
        message: "Thank you for completing the initial survey!",
        nextSteps: [
          "Check back every week for the weekly survey to track your progress",
          "There will be a final closing survey at the end of the study period"
        ]
      };
    } else if (stage === 'final') {
      return {
        title: "🎉 Final Survey Complete!",
        message: "Thank you for completing the final survey!",
        nextSteps: [
          "You have completed all surveys for this study",
          "Thank you for your participation in our food waste research"
        ]
      };
    } else {
      return {
        title: "🎉 Survey Complete!",
        message: `Thank you for completing the ${surveyTitle} survey!`,
        nextSteps: [
          "Check back every week for the weekly survey to track your progress",
          "There will be a final closing survey at the end of the study period"
        ]
      };
    }
  };

  const renderQuestion = (question) => {
    if (!question) return null;
    
    console.log("question object:", question)
    console.log("question.question:", question.question)
    console.log("question.question_text:", question.question_text)
    console.log("All question keys:", Object.keys(question))
    const questionId = question.id;
    const currentResponse = responses[questionId] ?? "";

    switch (question.type) {
      case "multiple_choice":
      case "rating":
        return (
          <Stack spacing={3}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(0, 0, 0, 0.85)', 
                fontWeight: 600, 
                mb: 1,
                fontSize: { xs: "1.2rem", sm: "1.35rem" },
                lineHeight: 1.4,
                letterSpacing: '-0.01em'
              }}
            >
              {question.question || question.question_text || 'Question text not available'}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { 
                  xs: "repeat(auto-fit, minmax(120px, 1fr))", 
                  sm: "repeat(auto-fit, minmax(150px, 1fr))" 
                },
                gap: { xs: 2, sm: 2.5 },
                width: "100%"
              }}
            >
              {question.options.map((option, idx) => {
                // Handle both string options and object options with {id, text}
                const optionText = typeof option === 'string' ? option : option.text;
                const optionValue = typeof option === 'string' ? option : option.text;
                const isSelected = currentResponse === optionValue;
                return (
                  <Button
                    key={idx}
                    variant={isSelected ? "contained" : "outlined"}
                    color={isSelected ? "primary" : "inherit"}
                    onClick={() => handleResponse(optionValue)}
                    sx={{
                      minHeight: { xs: 52, sm: 60 },
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      padding: { xs: "12px 16px", sm: "14px 20px" },
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: isSelected ? 600 : 500,
                      borderColor: isSelected ? 'primary.main' : 'rgba(0, 0, 0, 0.15)',
                      backgroundColor: isSelected ? 'primary.main' : '#fafafa',
                      color: isSelected ? 'white' : 'rgba(0, 0, 0, 0.85)',
                      boxShadow: isSelected ? '0 2px 8px rgba(25, 118, 210, 0.25)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        backgroundColor: isSelected ? 'primary.dark' : 'white',
                        borderColor: isSelected ? 'primary.dark' : 'primary.main',
                        transform: 'translateY(-2px)',
                        boxShadow: isSelected 
                          ? '0 6px 16px rgba(25, 118, 210, 0.35)' 
                          : '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }
                    }}
                  >
                    {optionText}
                  </Button>
                );
              })}
            </Box>
          </Stack>
        );
      case "number":
      case "text":
        return (
          <Stack spacing={2}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(0, 0, 0, 0.85)', 
                fontWeight: 600, 
                mb: 3,
                fontSize: { xs: "1.2rem", sm: "1.35rem" },
                lineHeight: 1.4,
                letterSpacing: '-0.01em'
              }}
            >
              {question.question || question.question_text || 'Question text not available'}
            </Typography>
            <TextField
              type={question.type}
              fullWidth
              variant="outlined"
              value={currentResponse || ""}
              onChange={(e) => handleResponse(e.target.value)}
              placeholder={question.placeholder || (question.type === "number" ? "Enter number" : "Enter text")}
              InputProps={question.type === "number" && question.question?.toLowerCase().includes("spend") ? {
                startAdornment: <Typography variant="body1" sx={{ mr: 1 }}>$</Typography>,
              } : undefined}
              inputProps={question.type === "number" ? {
                min: 0,
                step: question.question?.toLowerCase().includes("spend") ? 0.01 : 1,
              } : undefined}
              sx={{
                borderRadius: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: '#fafafa',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'white'
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                  }
                },
                '& .MuiInputBase-input': {
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                  padding: { xs: "14px 16px", sm: "16px 18px" },
                  fontWeight: 500
                }
              }}
            />
          </Stack>
        );
      case "money":
        return (
          <Stack spacing={2}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(0, 0, 0, 0.85)', 
                fontWeight: 600, 
                mb: 3,
                fontSize: { xs: "1.2rem", sm: "1.35rem" },
                lineHeight: 1.4,
                letterSpacing: '-0.01em'
              }}
            >
              {question.question || question.question_text || 'Question text not available'}
            </Typography>
            <TextField
              type="number"
              fullWidth
              variant="outlined"
              value={currentResponse || ""}
              onChange={(e) => handleResponse(e.target.value)}
              placeholder={question.placeholder || "Enter amount in dollars (e.g., 150)"}
              InputProps={{
                startAdornment: <Typography variant="body1" sx={{ mr: 1 }}>$</Typography>,
              }}
              inputProps={{
                min: 0,
                step: 0.01,
              }}
              sx={{
                borderRadius: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: '#fafafa',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'white'
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                  }
                },
                '& .MuiInputBase-input': {
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                  padding: { xs: "14px 16px", sm: "16px 18px" },
                  fontWeight: 500
                }
              }}
            />
          </Stack>
        );
      default:
        return null;
    }
  };

  // Safety check for empty questions array
  if (!questions || questions.length === 0) {
    return (
      <Box
        sx={{
          maxWidth: { xs: "100%", sm: 600 },
          margin: "auto",
          padding: { xs: 2, sm: 4 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "100vh",
          boxSizing: "border-box"
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{ 
            fontSize: { xs: "1.5rem", sm: "2rem" },
            textAlign: "center"
          }}
        >
          📝 Survey
        </Typography>
        <Paper 
          elevation={3} 
          sx={{ 
            padding: { xs: 2, sm: 4 }, 
            width: "100%", 
            color: "black",
            boxSizing: "border-box"
          }}
        >
          <Typography 
            variant="body1"
            sx={{ 
              fontSize: { xs: "1rem", sm: "1.1rem" },
              textAlign: "center"
            }}
          >
            No questions available for this survey.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          maxWidth: { xs: "100%", sm: 600 },
          margin: "auto",
          padding: { xs: 2, sm: 4 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "auto", /* Changed from 100vh to auto */
          boxSizing: "border-box"
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{ 
            fontSize: { xs: "1.6rem", sm: "2.1rem" },
            textAlign: "center",
            mb: { xs: 3, sm: 4 },
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'rgba(0, 0, 0, 0.85)'
          }}
        >
          📝 {surveyTitle} survey
        </Typography>

        <Paper 
          elevation={0}
          sx={{ 
            padding: { xs: 4, sm: 5 }, 
            width: "100%", 
            color: "black",
            boxSizing: "border-box",
            borderRadius: 4,
            border: 'none',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
            backgroundColor: 'white'
          }}
        >
          {currentQuestion && renderQuestion(currentQuestion)}

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              mt: { xs: 3, sm: 4 }
            }}
          >
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={currentIndex === 0}
              sx={{ 
                flex: 1,
                maxWidth: "120px",
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 500,
                borderColor: 'rgba(0, 0, 0, 0.15)',
                color: 'rgba(0, 0, 0, 0.85)',
                backgroundColor: '#fafafa',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'white',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                },
                '&:disabled': {
                  borderColor: 'rgba(0, 0, 0, 0.08)',
                  color: 'rgba(0, 0, 0, 0.25)',
                  backgroundColor: '#fafafa'
                }
              }}
            >
              ⬅
            </Button>
            <Typography 
              variant="body2"
              sx={{ 
                textAlign: "center",
                flex: 1,
                fontSize: { xs: "0.95rem", sm: "1rem" },
                fontWeight: 500,
                color: 'rgba(0, 0, 0, 0.6)',
                letterSpacing: '-0.01em'
              }}
            >
              Question {currentIndex + 1} of {questions.length}
            </Typography>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isEmptyResponse}
              sx={{ 
                flex: 1,
                maxWidth: "120px",
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: 'primary.main',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.35)'
                },
                '&:disabled': {
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  color: 'rgba(0, 0, 0, 0.25)',
                  boxShadow: 'none'
                }
              }}
            >
              {currentIndex < questions.length - 1 ? "Next ➡" : "Finish ✅"}
            </Button>
          </Box>
        </Paper>
      </Box>

             {/* Completion Modal */}
       <Dialog
         open={showCompletionModal}
         onClose={() => setShowCompletionModal(false)}
         maxWidth="sm"
         fullWidth
         sx={{
           '& .MuiDialog-paper': {
             margin: { xs: 2, sm: 4 },
             maxHeight: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 32px)' }
           }
         }}
       >
         <DialogTitle 
           sx={{ 
             textAlign: 'center', 
             color: 'primary.main',
             fontSize: { xs: "1.3rem", sm: "1.5rem" },
             pb: 2
           }}
         >
           {getCompletionMessage().title}
         </DialogTitle>
         <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
           <Typography 
             variant="body1" 
             sx={{ 
               mb: 2, 
               textAlign: 'center',
               fontSize: { xs: "1rem", sm: "1.1rem" }
             }}
           >
             {getCompletionMessage().message}
           </Typography>
           <Typography 
             variant="body2" 
             sx={{ 
               mb: 2, 
               color: 'text.secondary',
               fontSize: { xs: "0.95rem", sm: "1rem" }
             }}
           >
             <strong>What's next?</strong>
           </Typography>
           {getCompletionMessage().nextSteps.map((step, index) => (
             <Typography 
               key={index} 
               variant="body2" 
               sx={{ 
                 mb: 1, 
                 color: 'text.secondary',
                 fontSize: { xs: "0.9rem", sm: "0.95rem" },
                 lineHeight: 1.4
               }}
             >
               • {step}
             </Typography>
           ))}
           <Typography 
             variant="body2" 
             sx={{ 
               color: 'text.secondary', 
               fontStyle: 'italic', 
               mt: 2,
               fontSize: { xs: "0.9rem", sm: "0.95rem" },
               lineHeight: 1.4
             }}
           >
             Your responses help us understand food waste patterns and improve our recommendations.
           </Typography>
         </DialogContent>
         <DialogActions sx={{ justifyContent: 'center', pb: 3, px: { xs: 2, sm: 3 } }}>
           <Button
             variant="contained"
             onClick={handleGoHome}
             size="large"
             sx={{ 
               minWidth: { xs: 140, sm: 120 },
               fontSize: { xs: "1rem", sm: "1.1rem" },
               py: { xs: 1.5, sm: 1 }
             }}
           >
             Go to Home
           </Button>
         </DialogActions>
       </Dialog>
    </>
  );
};

export default Survey;
