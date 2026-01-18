import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { surveyAPI } from "../api";
import { getCurrentUserId } from "../utils/authUtils";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";

function SurveyGuard({ children }) {
  const [surveyStatus, setSurveyStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkSurveyStatus();
  }, []);

  const checkSurveyStatus = async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        setIsLoading(false);
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
      setIsLoading(false);

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
      // On error, allow access (don't block the app)
      setIsLoading(false);
    }
  };

  const isPublicPage = (pathname) => {
    const publicPages = ["/", "/auth/login", "/auth/register", "/terms", "/survey"];
    return publicPages.includes(pathname);
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



  // If still loading, show nothing
  if (isLoading) {
    return null;
  }

  // If user hasn't completed initial survey and is on a protected page, show modal
  if (surveyStatus && !surveyStatus.initialCompleted && !isPublicPage(location.pathname)) {
    return (
      <>
        {children}
        <Dialog
          open={showWelcomeModal}
          onClose={() => {}} // No close handler - force them to take action
          maxWidth="sm"
          fullWidth
          disableEscapeKeyDown
        >
          <DialogTitle sx={{ textAlign: 'center', color: 'primary.main' }}>
            🎯 Welcome to Food Hero!
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
              Before you start logging your food purchases, we need to learn a bit about you.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              <strong>Why is this important?</strong>
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 2 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Helps us understand your household and shopping habits
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Provides personalized insights and recommendations
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Contributes to our food waste research
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              The survey takes about 2-3 minutes to complete.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button
              variant="contained"
              onClick={handleStartSurvey}
              size="large"
              color="primary"
              sx={{ minWidth: 150 }}
            >
              Start Survey
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // If user has completed initial survey or is on a public page, render normally
  return (
    <>
      {children}
      {/* Weekly Survey Reminder Modal */}
      <Dialog
        open={showWeeklyModal}
        onClose={() => {
          // Only allow closing if within grace period
          const daysSince = surveyStatus?.daysSinceLastWeekly;
          if (daysSince !== null && daysSince <= 9) {
            handleRemindLater();
          }
        }}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={surveyStatus?.daysSinceLastWeekly === null || surveyStatus?.daysSinceLastWeekly > 9}
      >
        <DialogTitle sx={{ textAlign: 'center', color: 'primary.main' }}>
          {surveyStatus?.daysSinceLastWeekly === null || surveyStatus?.daysSinceLastWeekly > 9 
            ? '⚠️ Weekly Survey Required!' 
            : '📊 Weekly Check-In Time!'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
            {surveyStatus?.daysSinceLastWeekly === null || surveyStatus?.daysSinceLastWeekly > 9
              ? 'You must complete your weekly survey to continue using the app.'
              : 'It\'s time for your weekly survey! Help us track your food waste journey.'}
          </Typography>
          
          {surveyStatus?.daysSinceLastWeekly > 9 && (
            <Typography variant="body2" sx={{ mb: 2, color: 'error.main', textAlign: 'center', fontWeight: 'bold' }}>
              Your survey is overdue by {surveyStatus.daysSinceLastWeekly - 7} days. Please complete it now.
            </Typography>
          )}
          
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            <strong>Why complete weekly surveys?</strong>
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
              Track your progress over time
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
              Help us understand changing habits and patterns
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
              Contribute valuable data to reduce food waste
            </Typography>
          </Box>
          {surveyStatus?.daysSinceLastWeekly && surveyStatus.daysSinceLastWeekly <= 9 && (
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              It's been {surveyStatus.daysSinceLastWeekly} days since your last weekly survey.
              {surveyStatus.daysSinceLastWeekly >= 7 && surveyStatus.daysSinceLastWeekly <= 9 && (
                <span style={{ color: '#1976d2', fontWeight: 'bold' }}>
                  {' '}You have {10 - surveyStatus.daysSinceLastWeekly} day{10 - surveyStatus.daysSinceLastWeekly > 1 ? 's' : ''} left to complete it.
                </span>
              )}
            </Typography>
          )}
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 1 }}>
            The survey takes about 2-3 minutes to complete.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleStartWeeklySurvey}
            size="large"
            color="primary"
            sx={{ minWidth: 150 }}
          >
            Start Survey
          </Button>
          {/* Only show "Remind Me Tomorrow" if within grace period */}
          {surveyStatus?.daysSinceLastWeekly !== null && surveyStatus?.daysSinceLastWeekly <= 9 && (
            <Button
              variant="outlined"
              onClick={handleRemindLater}
              size="large"
              color="primary"
              sx={{ minWidth: 150 }}
            >
              Remind Me Tomorrow
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export default SurveyGuard;
