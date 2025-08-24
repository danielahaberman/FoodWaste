import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { surveyAPI } from "../api";
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkSurveyStatus();
  }, []);

  const checkSurveyStatus = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setIsLoading(false);
        return;
      }

      const response = await surveyAPI.getSurveyStatus(userId);
      setSurveyStatus(response.data);
      setIsLoading(false);

      // Check if user hasn't completed initial survey and is trying to access protected pages
      const surveyModalShown = localStorage.getItem('surveyModalShown');
      if (!response.data.initialCompleted && !isPublicPage(location.pathname) && !surveyModalShown) {
        setShowWelcomeModal(true);
      }
    } catch (error) {
      console.error("Error checking survey status:", error);
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
            🎯 Welcome to Food Waste Tracker!
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
  return children;
}

export default SurveyGuard;
