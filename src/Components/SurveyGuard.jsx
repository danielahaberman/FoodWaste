import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { surveyAPI } from "../api";
import { getCurrentUserId } from "../utils/authUtils";
import {
  Typography,
  Box,
  Stack,
} from "@mui/material";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import AppConfirmDialog from "./AppConfirmDialog";

function SurveyGuard({ children }) {
  const [surveyStatus, setSurveyStatus] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isPublicPage = (pathname) => {
    const publicPages = ["/", "/auth/login", "/auth/register", "/terms", "/survey"];
    return publicPages.includes(pathname);
  };

  useEffect(() => {
    checkSurveyStatus();
  }, []);

  // Never overlay other tabs with survey modals; close when user opens the survey page.
  useEffect(() => {
    if (isPublicPage(location.pathname)) {
      setShowWelcomeModal(false);
      setShowWeeklyModal(false);
    }
  }, [location.pathname]);

  const checkSurveyStatus = async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return;
      }

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Survey check timeout')), 3000)
      );
      
      const response = await Promise.race([
        surveyAPI.getSurveyStatus(userId),
        timeoutPromise
      ]);
      
      setSurveyStatus(response.data);

      // Check if user hasn't completed initial survey and is trying to access protected pages
      const surveyModalShown = localStorage.getItem('surveyModalShown');
      if (!response.data.initialCompleted && !isPublicPage(location.pathname) && !surveyModalShown) {
        setShowWelcomeModal(true);
      }
      
      // Check if weekly survey is due
      const today = new Date().toDateString();
      const weeklyModalShownToday = localStorage.getItem(`weeklyModalShown_${today}`);
      
      if (response.data.initialCompleted && response.data.weeklyDue && !isPublicPage(location.pathname)) {
        // Weekly survey is due if 7+ days have passed since last weekly survey OR since initial survey completion
        // The backend now ensures weeklyDue is only true if 7+ days have passed
        // If more than 9 days have passed (7 days + 2 grace days), force the survey
        const forceSurvey = response.data.daysSinceLastWeekly !== null && response.data.daysSinceLastWeekly > 9;
        
        if (forceSurvey || !weeklyModalShownToday) {
          setShowWeeklyModal(true);
        }
      }
    } catch (error) {
      console.error("Error checking survey status:", error);
    }
  };

  const handleStartSurvey = () => {
    setShowWelcomeModal(false);
    navigate("/survey?stage=initial");
  };

  const handleStartWeeklySurvey = () => {
    const today = new Date().toDateString();
    localStorage.setItem(`weeklyModalShown_${today}`, 'true');
    setShowWeeklyModal(false);
    navigate("/survey?stage=weekly");
  };

  const handleRemindLater = () => {
    // Check if this option should be available (only within 2-day grace period)
    const daysSince = surveyStatus?.daysSinceLastWeekly;
    
    // Allow postpone only if within grace period (7-9 days)
    if (daysSince === null || daysSince > 9) {
      // Force them to complete - don't allow postpone
      return;
    }
    
    const today = new Date().toDateString();
    localStorage.setItem(`weeklyModalShown_${today}`, 'true');
    setShowWeeklyModal(false);
  };



  // Never block page rendering while survey status loads.
  if (surveyStatus && !surveyStatus.initialCompleted && !isPublicPage(location.pathname)) {
    return (
      <>
        {children}
        <AppConfirmDialog
          open={showWelcomeModal && !isPublicPage(location.pathname)}
          tone="primary"
          icon={<AssignmentOutlinedIcon />}
          title="Welcome to Food Hero!"
          maxWidth="sm"
          scrollable
          zIndex={1500}
          disableEscapeKeyDown
          hideCloseButton
          primaryAction={{
            label: "Start survey",
            onClick: handleStartSurvey,
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
              Before you start logging food purchases, we need to learn a bit about you.
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              Why is this important?
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                Helps us understand your household and shopping habits
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                Provides personalized insights and recommendations
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Contributes to our food waste research
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
              Takes about 2–3 minutes to complete.
            </Typography>
          </Stack>
        </AppConfirmDialog>
      </>
    );
  }

  // If user has completed initial survey or is on a public page, render normally
  return (
    <>
      {children}
      {/* Weekly Survey Reminder Modal — hidden on survey route */}
      <AppConfirmDialog
        open={showWeeklyModal && !isPublicPage(location.pathname)}
        onClose={() => {
          const daysSince = surveyStatus?.daysSinceLastWeekly;
          if (daysSince !== null && daysSince <= 9) {
            handleRemindLater();
          }
        }}
        tone={
          surveyStatus?.daysSinceLastWeekly === null ||
          surveyStatus?.daysSinceLastWeekly > 9
            ? "warning"
            : "primary"
        }
        icon={<EventNoteOutlinedIcon />}
        title={
          surveyStatus?.daysSinceLastWeekly === null ||
          surveyStatus?.daysSinceLastWeekly > 9
            ? "Weekly survey required"
            : "Weekly check-in"
        }
        maxWidth="sm"
        scrollable
        zIndex={1500}
        disableEscapeKeyDown={
          surveyStatus?.daysSinceLastWeekly === null ||
          surveyStatus?.daysSinceLastWeekly > 9
        }
        hideCloseButton={
          surveyStatus?.daysSinceLastWeekly === null ||
          surveyStatus?.daysSinceLastWeekly > 9
        }
        primaryAction={{
          label: "Start survey",
          onClick: handleStartWeeklySurvey,
        }}
        secondaryAction={
          surveyStatus?.daysSinceLastWeekly !== null &&
          surveyStatus?.daysSinceLastWeekly <= 9
            ? {
                label: "Remind me tomorrow",
                onClick: handleRemindLater,
              }
            : undefined
        }
      >
        <Stack spacing={1.5}>
          <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
            {surveyStatus?.daysSinceLastWeekly === null ||
            surveyStatus?.daysSinceLastWeekly > 9
              ? "Please complete your weekly survey to continue using the app."
              : "It's time for your weekly survey. Help us track your food waste journey."}
          </Typography>

          {surveyStatus?.daysSinceLastWeekly > 9 && (
            <Typography variant="body2" color="error.main" fontWeight={600}>
              Your survey is overdue by {surveyStatus.daysSinceLastWeekly - 7} days.
            </Typography>
          )}

          <Typography variant="body2" fontWeight={600}>
            Why complete weekly surveys?
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
              Track your progress over time
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
              Help us understand changing habits and patterns
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Contribute valuable data to reduce food waste
            </Typography>
          </Box>

          {surveyStatus?.daysSinceLastWeekly &&
            surveyStatus.daysSinceLastWeekly <= 9 && (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                It&apos;s been {surveyStatus.daysSinceLastWeekly} days since your last weekly
                survey.
                {surveyStatus.daysSinceLastWeekly >= 7 &&
                  surveyStatus.daysSinceLastWeekly <= 9 && (
                    <>
                      {" "}
                      You have {10 - surveyStatus.daysSinceLastWeekly} day
                      {10 - surveyStatus.daysSinceLastWeekly > 1 ? "s" : ""} left to complete it.
                    </>
                  )}
              </Typography>
            )}

          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
            Takes about 2–3 minutes to complete.
          </Typography>
        </Stack>
      </AppConfirmDialog>
    </>
  );
}

export default SurveyGuard;
