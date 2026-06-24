// @ts-nocheck
/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  LinearProgress,
  Chip,
} from "@mui/material";
import AppConfirmDialog from "./AppConfirmDialog";
import { getCurrentUserId } from "../utils/authUtils";
import { useIsTabActive } from "../context/TabVisibilityContext";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";

const cardSx = {
  borderRadius: 3,
  border: "none",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
  backgroundColor: "white",
};

function getStageLabel(stage) {
  const key = String(stage || "").toLowerCase();
  if (key === "initial") return "Initial survey";
  if (key === "weekly") return "Weekly check-in";
  if (key === "final") return "Final survey";
  return "Survey";
}

function getStageDescription(stage) {
  const key = String(stage || "").toLowerCase();
  if (key === "initial") {
    return "Help us learn about your household and shopping habits.";
  }
  if (key === "weekly") {
    return "A quick update on your food waste patterns this week.";
  }
  if (key === "final") {
    return "Share your closing thoughts at the end of the study.";
  }
  return "Your answers help us understand food waste patterns.";
}

const Survey = ({ questions }) => {
  const navigate = useNavigate();
  const isTabActive = useIsTabActive();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [error, setError] = useState(null);
  const [resumedFromSaved, setResumedFromSaved] = useState(false);

  const surveyTitle = questions[0]?.stage || "Survey";
  const stageLabel = getStageLabel(surveyTitle);
  const userId = getCurrentUserId();

  const progressPercent = useMemo(() => {
    if (!questions?.length) return 0;
    return Math.round(((currentIndex + 1) / questions.length) * 100);
  }, [currentIndex, questions?.length]);

  const answeredCount = useMemo(
    () => questions.filter((q) => responses[q.id] != null && responses[q.id] !== "").length,
    [questions, responses]
  );

  useEffect(() => {
    if (!isTabActive) {
      setShowCompletionModal(false);
    }
  }, [isTabActive]);

  useEffect(() => {
    const loadSavedProgress = async () => {
      if (!userId || !questions || questions.length === 0) {
        setIsLoadingProgress(false);
        return;
      }

      try {
        const response = await surveyAPI.getSurveyResponses({
          userId,
          stage: surveyTitle,
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
        setResumedFromSaved(startIndex > 0 || Object.keys(savedResponses).length > 0);
      } catch (err) {
        console.error("Error loading saved survey progress:", err);
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
    } catch (err) {
      console.error("Failed to save response:", err);

      if (retries > 0 && (err.code === "ERR_NETWORK" || err.message === "Network Error")) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return submitResponse({ questionId, response }, retries - 1);
      }

      const errorMessage =
        err.code === "ERR_NETWORK" || err.message === "Network Error"
          ? "Network error. Please check your connection and try again."
          : err.response?.data?.error || "Failed to save response. Please try again.";

      setError(errorMessage);
      throw err;
    }
  };

  const advanceOrFinish = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setShowCompletionModal(true);
    }
  }, [currentIndex, questions.length]);

  const handleNext = async () => {
    const qId = questions[currentIndex]?.id;
    const response = responses[qId];

    if (response !== undefined && response !== null) {
      setIsSaving(true);
      try {
        await submitResponse({ questionId: qId, response });
      } catch {
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
    }

    advanceOrFinish();
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
    window.dispatchEvent(new CustomEvent("taskCompleted"));
    setShowCompletionModal(false);
    navigate("/log");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isEmptyResponse && !isSaving) {
      e.preventDefault();
      handleNext();
    }
  };

  const getCompletionMessage = () => {
    const stage = surveyTitle.toLowerCase();

    if (stage === "weekly") {
      return {
        title: "Weekly survey complete",
        message: "Thank you for completing this week's survey!",
        nextSteps: [
          "Your next weekly survey will be available in 7 days",
          "Keep tracking your food purchases and consumption in the meantime",
          "There will be a final closing survey at the end of the study period",
        ],
      };
    }
    if (stage === "initial") {
      return {
        title: "Initial survey complete",
        message: "Thank you for completing the initial survey!",
        nextSteps: [
          "Check back every week for the weekly survey to track your progress",
          "There will be a final closing survey at the end of the study period",
        ],
      };
    }
    if (stage === "final") {
      return {
        title: "Final survey complete",
        message: "Thank you for completing the final survey!",
        nextSteps: [
          "You have completed all surveys for this study",
          "Thank you for your participation in our food waste research",
        ],
      };
    }
    return {
      title: "Survey complete",
      message: `Thank you for completing the ${stageLabel}!`,
      nextSteps: [
        "Check back every week for the weekly survey to track your progress",
        "There will be a final closing survey at the end of the study period",
      ],
    };
  };

  const renderQuestionText = (question) => (
    <Typography
      variant="subtitle1"
      component="h2"
      sx={{
        fontWeight: 700,
        fontSize: { xs: "1.05rem", sm: "1.15rem" },
        lineHeight: 1.4,
        letterSpacing: "-0.01em",
      }}
    >
      {question.question || question.question_text || "Question text not available"}
    </Typography>
  );

  const renderChoiceOptions = (question) => {
    const questionId = question.id;
    const response = responses[questionId] ?? "";

    return (
      <Stack spacing={1}>
        {renderQuestionText(question)}
        <Stack spacing={1} sx={{ mt: 0.5 }}>
          {question.options.map((option, idx) => {
            const optionText = typeof option === "string" ? option : option.text;
            const optionValue = typeof option === "string" ? option : option.text;
            const isSelected = response === optionValue;

            return (
              <Paper
                key={idx}
                elevation={0}
                onClick={() => handleResponse(optionValue)}
                sx={{
                  p: 1.25,
                  cursor: "pointer",
                  borderRadius: 2.5,
                  border: "2px solid",
                  borderColor: isSelected ? "primary.main" : "transparent",
                  backgroundColor: isSelected
                    ? "rgba(25, 118, 210, 0.08)"
                    : "rgba(0, 0, 0, 0.03)",
                  transition: "border-color 0.15s ease, background-color 0.15s ease",
                  "&:hover": {
                    backgroundColor: isSelected
                      ? "rgba(25, 118, 210, 0.12)"
                      : "rgba(0, 0, 0, 0.05)",
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.25}>
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      flexShrink: 0,
                      border: "2px solid",
                      borderColor: isSelected ? "primary.main" : "rgba(0,0,0,0.2)",
                      backgroundColor: isSelected ? "primary.main" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected && (
                      <CheckIcon sx={{ fontSize: 14, color: "white" }} />
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isSelected ? 600 : 500,
                      lineHeight: 1.4,
                      flex: 1,
                    }}
                  >
                    {optionText}
                  </Typography>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      </Stack>
    );
  };

  const renderTextInput = (question, type) => {
    const questionId = question.id;
    const response = responses[questionId] ?? "";
    const isMoney = type === "money" || question.type === "money";
    const isNumber = type === "number" || question.type === "number";

    return (
      <Stack spacing={1.5}>
        {renderQuestionText(question)}
        <TextField
          type={isMoney || isNumber ? "number" : "text"}
          fullWidth
          variant="outlined"
          value={response}
          onChange={(e) => handleResponse(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            question.placeholder ||
            (isMoney
              ? "Enter amount (e.g. 150)"
              : isNumber
                ? "Enter number"
                : "Type your answer")
          }
          InputProps={
            isMoney || (isNumber && question.question?.toLowerCase().includes("spend"))
              ? { startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography> }
              : undefined
          }
          inputProps={
            isMoney || isNumber
              ? {
                  min: 0,
                  step: isMoney || question.question?.toLowerCase().includes("spend") ? 0.01 : 1,
                }
              : undefined
          }
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2.5,
              backgroundColor: "rgba(0, 0, 0, 0.03)",
            },
          }}
        />
      </Stack>
    );
  };

  const renderQuestion = (question) => {
    if (!question) return null;

    switch (question.type) {
      case "multiple_choice":
      case "rating":
        return renderChoiceOptions(question);
      case "number":
        return renderTextInput(question, "number");
      case "money":
        return renderTextInput(question, "money");
      case "text":
        return renderTextInput(question, "text");
      default:
        return null;
    }
  };

  if (isLoadingProgress) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading your progress…
        </Typography>
      </Box>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <Paper elevation={0} sx={{ ...cardSx, p: 3, textAlign: "center" }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          No questions available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          There are no survey questions to show right now.
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <Stack spacing={2}>
        <Paper elevation={0} sx={{ ...cardSx, p: 2 }}>
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 1.5 }}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                {stageLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                {getStageDescription(surveyTitle)}
              </Typography>
            </Box>
            <Chip
              label={`${currentIndex + 1} / ${questions.length}`}
              size="small"
              sx={{ fontWeight: 700, flexShrink: 0 }}
            />
          </Stack>

          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 6,
              borderRadius: 3,
              mb: 1,
              backgroundColor: "rgba(0, 0, 0, 0.08)",
            }}
          />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {progressPercent}% complete
            </Typography>
            {resumedFromSaved && (
              <Typography variant="caption" color="primary.main" fontWeight={600}>
                Resumed · {answeredCount} saved
              </Typography>
            )}
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ ...cardSx, p: 2.5 }}>
          {currentQuestion && renderQuestion(currentQuestion)}

          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ mt: 3, pt: 2, borderTop: "1px solid rgba(0,0,0,0.06)" }}
          >
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={currentIndex === 0 || isSaving}
              startIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                minWidth: 0,
                px: 2,
              }}
            >
              Back
            </Button>

            <Box sx={{ flex: 1 }} />

            <Button
              variant="contained"
              onClick={handleNext}
              disabled={isEmptyResponse || isSaving}
              endIcon={
                isSaving ? (
                  <CircularProgress size={16} color="inherit" />
                ) : currentIndex < questions.length - 1 ? (
                  <ArrowForwardIcon />
                ) : (
                  <CheckIcon />
                )
              }
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                minWidth: 110,
                px: 2.5,
              }}
            >
              {isSaving
                ? "Saving…"
                : currentIndex < questions.length - 1
                  ? "Next"
                  : "Finish"}
            </Button>
          </Stack>
        </Paper>
      </Stack>

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
          label: "Go to food log",
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
        </Stack>
      </AppConfirmDialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Survey;
