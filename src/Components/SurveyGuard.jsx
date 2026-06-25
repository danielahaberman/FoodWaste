import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSessionData } from "../hooks/useSessionData";
import {
  Typography,
  Box,
  Stack,
} from "@mui/material";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import AppConfirmDialog from "./AppConfirmDialog";
import {
  isWeeklySurveyForced,
  markInitialSurveyModalShown,
  markWeeklySurveyModalShown,
  notifySurveyReminderClose,
  notifySurveyReminderOpen,
  shouldOfferInitialSurveyModal,
  shouldOfferWeeklySurveyModal,
} from "../utils/reminderUtils";

const PUBLIC_PAGES = ["/", "/auth/login", "/auth/register", "/terms", "/survey"];

function isPublicPage(pathname) {
  return PUBLIC_PAGES.includes(pathname);
}

function SurveyGuard({ children }) {
  const { data } = useSessionData();
  const surveyStatus = data?.surveyStatus ?? null;
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const applyReminderState = useCallback((status, pathname) => {
    if (!status || isPublicPage(pathname)) {
      setShowWelcomeModal(false);
      setShowWeeklyModal(false);
      return;
    }

    setShowWelcomeModal(shouldOfferInitialSurveyModal(status, pathname, isPublicPage));
    setShowWeeklyModal(shouldOfferWeeklySurveyModal(status, pathname, isPublicPage));
  }, []);

  useEffect(() => {
    if (surveyStatus) {
      applyReminderState(surveyStatus, location.pathname);
    } else if (isPublicPage(location.pathname)) {
      setShowWelcomeModal(false);
      setShowWeeklyModal(false);
    }
  }, [location.pathname, surveyStatus, applyReminderState]);

  useEffect(() => {
    const blocking = showWelcomeModal || showWeeklyModal;
    if (blocking) {
      notifySurveyReminderOpen();
    } else {
      notifySurveyReminderClose();
    }
  }, [showWelcomeModal, showWeeklyModal]);

  const handleStartSurvey = () => {
    markInitialSurveyModalShown();
    setShowWelcomeModal(false);
    navigate("/survey?stage=initial", { replace: true });
  };

  const handleStartWeeklySurvey = () => {
    markWeeklySurveyModalShown();
    setShowWeeklyModal(false);
    navigate("/survey?stage=weekly", { replace: true });
  };

  const handleRemindLater = () => {
    const daysSince = surveyStatus?.daysSinceLastWeekly;
    if (daysSince !== null && daysSince > 9) return;
    markWeeklySurveyModalShown();
    setShowWeeklyModal(false);
  };

  const weeklyForced = isWeeklySurveyForced(surveyStatus);

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
          presentation="centered"
          disableEscapeKeyDown
          hideCloseButton
          primaryAction={{
            label: "Start survey",
            onClick: handleStartSurvey,
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
              Before you start logging food, we need a quick intro survey (~2–3 min).
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
              It helps personalize your experience and supports food waste research.
            </Typography>
          </Stack>
        </AppConfirmDialog>
      </>
    );
  }

  return (
    <>
      {children}
      <AppConfirmDialog
        open={showWeeklyModal && !isPublicPage(location.pathname)}
        onClose={() => {
          if (!weeklyForced) handleRemindLater();
        }}
        tone={weeklyForced ? "warning" : "primary"}
        icon={<EventNoteOutlinedIcon />}
        title={weeklyForced ? "Weekly survey required" : "Weekly check-in"}
        maxWidth="sm"
        scrollable
        zIndex={1500}
        presentation="centered"
        disableEscapeKeyDown={weeklyForced}
        hideCloseButton={weeklyForced}
        primaryAction={{
          label: "Start survey",
          onClick: handleStartWeeklySurvey,
        }}
        secondaryAction={
          !weeklyForced
            ? {
                label: "Remind me tomorrow",
                onClick: handleRemindLater,
              }
            : undefined
        }
      >
        <Stack spacing={1.5}>
          <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
            {weeklyForced
              ? "Please complete your weekly survey to keep using the app."
              : "Quick weekly check-in (~2–3 min) to track your progress."}
          </Typography>

          {surveyStatus?.daysSinceLastWeekly > 9 && (
            <Typography variant="body2" color="error.main" fontWeight={600}>
              Overdue by {surveyStatus.daysSinceLastWeekly - 7} days.
            </Typography>
          )}

          {!weeklyForced && surveyStatus?.daysSinceLastWeekly != null && (
            <Typography variant="caption" color="text.secondary">
              Last completed {surveyStatus.daysSinceLastWeekly} days ago.
              {surveyStatus.daysSinceLastWeekly >= 7 &&
                surveyStatus.daysSinceLastWeekly <= 9 &&
                ` ${10 - surveyStatus.daysSinceLastWeekly} day${
                  10 - surveyStatus.daysSinceLastWeekly > 1 ? "s" : ""
                } left in the grace period.`}
            </Typography>
          )}
        </Stack>
      </AppConfirmDialog>
    </>
  );
}

export default SurveyGuard;
