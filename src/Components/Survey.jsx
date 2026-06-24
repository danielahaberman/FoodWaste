// @ts-nocheck
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { surveyAPI } from "../api";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import AppConfirmDialog from "./AppConfirmDialog";
import { getCurrentUserId } from "../utils/authUtils";
import { useIsTabActive } from "../context/TabVisibilityContext";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const Survey = ({ questions }) => {
  const isTabActive = useIsTabActive();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({}); // object keyed by questionId
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [error, setError] = useState(null);
  
  const surveyTitle = questions[0]?.stage || 'Survey';
  const userId = getCurrentUserId();

  useEffect(() => {
    if (!isTabActive) {
      setShowCompletionModal(false);
    }
  }, [isTabActive]);

  // Load saved responses from backend on mount
  useEffect(() => {
    const loadSavedProgress = async () => {
      if (!userId || !questions || questions.length === 0) {
        setIsLoadingProgress(false);
        return;
      }

      try {
        const response = await surveyAPI.getSurveyResponses({
          userId,
          stage: surveyTitle
        });

        const savedResponses = response.data || {};

        let startIndex = 0;
        for (let i = 0; i < questions.length; i++) {
          const questionId = questions[i].id;
          if (!savedResponses[questionId]) {
            startIndex = i;
            break;
          }
          if (i === questions.length - 1) {
            startIndex = i;
          }
        }

        setResponses(savedResponses);
        setCurrentIndex(startIndex);
      } catch (error) {
        console.error("Error loading saved survey progress:", error);
        setCurrentIndex(0);
        setResponses({});
      } finally {
        setIsLoadingProgress(false);
      }
    };

    loadSavedProgress();
  }, [userId, surveyTitle, questions]);
  
  const currentQuestion = questions[currentIndex];
  const currentQuestionId = currentQuestion?.id;
  const currentResponse = responses[currentQuestionId];

  // For number inputs, just check if it's non-empty (handle 0 correctly)
  const isEmptyResponse =
    currentResponse === undefined ||
    currentResponse === null ||
    (typeof currentResponse === "string" && currentResponse.trim() === "");

  const submitResponse = async ({ questionId, response }, retries = 2) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setError("You must be logged in to save responses.");
      throw new Error("User not authenticated");
    }

    try {
      await surveyAPI.submitSurveyResponse({
        userId: currentUserId,
        questionId,
        response,
      });
    } catch (error) {
      console.error("Failed to save response:", error);
      
      // Retry on network errors
      if (retries > 0 && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
        console.log(`Retrying survey submission (${retries} retries left)...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        return submitResponse({ questionId, response }, retries - 1);
      }
      
      // Show user-friendly error message
      const errorMessage = error.code === 'ERR_NETWORK' || error.message === 'Network Error'
        ? "Network error. Please check your connection and try again."
        : error.response?.data?.error || "Failed to save response. Please try again.";
      
      setError(errorMessage);
      throw error; // Re-throw to allow caller to handle
    }
  };

  const handleNext = async () => {
    const currentQuestionId = questions[currentIndex]?.id;
    const response = responses[currentQuestionId];

    // If there's a response, try to save it first
    if (response !== undefined && response !== null) {
      setIsSaving(true);
      try {
        await submitResponse({ questionId: currentQuestionId, response });
        // Only advance if save was successful
      } catch (error) {
        // Error already handled in submitResponse (alert shown)
        // Don't advance to next question on failure
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
    }

    // Only advance if save succeeded (or no response needed)
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
    
    const questionId = question.id;
    const currentResponse = responses[questionId] ?? "";

    switch (question.type) {
      case "multiple_choice":
      case "rating":
        return (
          <Stack spacing={2}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(0, 0, 0, 0.85)', 
                fontWeight: 600, 
                mb: 0.5,
                fontSize: { xs: "1.15rem", sm: "1.25rem" },
                lineHeight: 1.3,
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
                gap: { xs: 1.5, sm: 2 },
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
                    type="button"
                    variant={isSelected ? "contained" : "outlined"}
                    color={isSelected ? "primary" : "inherit"}
                    onClick={() => handleResponse(optionValue)}
                    sx={{
                      minHeight: { xs: 48, sm: 48 },
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      padding: { xs: "10px 14px", sm: "12px 16px" },
                      whiteSpace: "normal",
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
                      position: 'relative',
                      zIndex: 1,
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
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
          <Stack spacing={1.5}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(0, 0, 0, 0.85)', 
                fontWeight: 600, 
                mb: 1,
                fontSize: { xs: "1.15rem", sm: "1.25rem" },
                lineHeight: 1.3,
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
                  fontSize: { xs: "1rem", sm: "1.05rem" },
                  padding: { xs: "12px 14px", sm: "14px 16px" },
                  fontWeight: 500
                }
              }}
            />
          </Stack>
        );
      case "money":
        return (
          <Stack spacing={1.5}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(0, 0, 0, 0.85)', 
                fontWeight: 600, 
                mb: 1,
                fontSize: { xs: "1.15rem", sm: "1.25rem" },
                lineHeight: 1.3,
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
                  fontSize: { xs: "1rem", sm: "1.05rem" },
                  padding: { xs: "12px 14px", sm: "14px 16px" },
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

  // Show loading state while fetching saved progress
  if (isLoadingProgress) {
    return (
      <Box
        sx={{
          maxWidth: { xs: "100%", sm: 600 },
          margin: "auto",
          padding: { xs: 2, sm: 4 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          boxSizing: "border-box"
        }}
      >
        <CircularProgress />
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>
          Loading your progress...
        </Typography>
      </Box>
    );
  }

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
          padding: { xs: 1.5, sm: 3 },
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
            fontSize: { xs: "1.5rem", sm: "1.9rem" },
            textAlign: "center",
            mb: { xs: 2, sm: 2.5 },
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
            padding: { xs: 3, sm: 3.5 }, 
            width: "100%", 
            color: "black",
            boxSizing: "border-box",
            borderRadius: 4,
            border: 'none',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
            backgroundColor: 'white',
            position: 'relative',
            zIndex: 1,
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
              mt: { xs: 2.5, sm: 3 }
            }}
          >
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={currentIndex === 0 || isSaving}
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
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              {currentIndex + 1} of {questions.length}
            </Typography>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isEmptyResponse || isSaving}
              sx={{ 
                flex: 1,
                maxWidth: "120px",
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
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
              {isSaving ? (
                <>
                  <CircularProgress size={16} sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />
                  Saving...
                </>
              ) : (
                currentIndex < questions.length - 1 ? "Next ➡" : "Finish ✅"
              )}
            </Button>
          </Box>
        </Paper>
      </Box>

       <AppConfirmDialog
         open={showCompletionModal && isTabActive}
         onClose={() => setShowCompletionModal(false)}
         tone="success"
         icon={<CheckCircleOutlineIcon />}
         title={getCompletionMessage().title}
         maxWidth="sm"
         scrollable
         zIndex={1500}
         primaryAction={{
           label: "Go to home",
           onClick: handleGoHome,
         }}
       >
         <Stack spacing={1.5}>
           <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
             {getCompletionMessage().message}
           </Typography>
           <Typography variant="body2" fontWeight={600}>
             What&apos;s next?
           </Typography>
           {getCompletionMessage().nextSteps.map((step, index) => (
             <Typography
               key={index}
               variant="body2"
               color="text.secondary"
               sx={{ lineHeight: 1.45 }}
             >
               • {step}
             </Typography>
           ))}
           <Typography
             variant="caption"
             color="text.secondary"
             sx={{ fontStyle: "italic", lineHeight: 1.45 }}
           >
             Your responses help us understand food waste patterns and improve our
             recommendations.
           </Typography>
         </Stack>
       </AppConfirmDialog>

       {/* Error Snackbar */}
       <Snackbar
         open={!!error}
         autoHideDuration={6000}
         onClose={() => setError(null)}
         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
       >
         <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
           {error}
         </Alert>
       </Snackbar>
    </>
  );
};

export default Survey;
