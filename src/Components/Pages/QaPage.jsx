import React, { useEffect, useState, useRef, useCallback } from "react";
import dayjs from "dayjs";
import { surveyAPI } from "../../api";
import { useSearchParams, useNavigate } from "react-router-dom";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import weekOfYear from "dayjs/plugin/weekOfYear";

import Survey from "../Survey";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Button,
  Stack,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import PageWrapper from "../PageWrapper";
import { getCurrentUserId } from "../../utils/authUtils";
import { useIsTabActive } from "../../context/TabVisibilityContext";

dayjs.extend(weekOfYear);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const cardSx = {
  borderRadius: 3,
  border: "none",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
  backgroundColor: "white",
};

function QaPage() {
  const [surveyQuestions, setSurveyQuestions] = useState(null);
  const [activeStage, setActiveStage] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const navigate = useNavigate();
  const isTabActive = useIsTabActive();
  const wasTabActiveRef = useRef(isTabActive);
  const [searchParams] = useSearchParams();
  const stageParam = searchParams.get("stage");

  const fetchSurveyStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const userId = getCurrentUserId();
      if (!userId) {
        setErrorStatus("You must be logged in to view surveys.");
        setLoadingStatus(false);
        return;
      }
      const res = await surveyAPI.getSurveyStatus(userId);

      if (stageParam) {
        const qRes = await surveyAPI.getSurveyQuestions({ stage: stageParam });
        setSurveyQuestions(qRes.data);
        setActiveStage(stageParam);
      } else {
        const completedThisWeek =
          res.data.lastWeeklyCompletion &&
          dayjs(res.data.lastWeeklyCompletion).week() === dayjs().week() &&
          dayjs(res.data.lastWeeklyCompletion).year() === dayjs().year();

        if (!res.data.initialCompleted || !completedThisWeek) {
          const stage = res.data.initialCompleted ? "weekly" : "initial";
          const qRes = await surveyAPI.getSurveyQuestions({ stage });
          setSurveyQuestions(qRes.data);
          setActiveStage(stage);
        } else {
          setSurveyQuestions([]);
          setActiveStage("weekly");
        }
      }

      setErrorStatus(null);
    } catch (err) {
      console.error("Failed to load survey status:", err);
      setErrorStatus("Failed to load survey status.");
    } finally {
      setLoadingStatus(false);
    }
  }, [stageParam]);

  useEffect(() => {
    fetchSurveyStatus();
  }, [fetchSurveyStatus]);

  useEffect(() => {
    if (isTabActive && !wasTabActiveRef.current) {
      fetchSurveyStatus();
    }
    wasTabActiveRef.current = isTabActive;
  }, [isTabActive, fetchSurveyStatus]);

  const nextSurveyDate = dayjs().startOf("week").add(1, "week").format("MMM D, YYYY");

  const pageTitle =
    activeStage === "initial"
      ? "Initial survey"
      : activeStage === "weekly"
        ? surveyQuestions?.length > 0
          ? "Weekly check-in"
          : "Survey"
        : activeStage === "final"
          ? "Final survey"
          : "Survey";

  return (
    <PageWrapper title={pageTitle}>
      {loadingStatus ? (
        <Box display="flex" flexDirection="column" alignItems="center" py={6}>
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading survey…
          </Typography>
        </Box>
      ) : errorStatus ? (
        <Paper elevation={0} sx={{ ...cardSx, p: 3, textAlign: "center" }}>
          <Typography color="error" fontWeight={600} gutterBottom>
            {errorStatus}
          </Typography>
          <Button
            variant="outlined"
            onClick={fetchSurveyStatus}
            sx={{ mt: 1, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Try again
          </Button>
        </Paper>
      ) : surveyQuestions?.length > 0 ? (
        <Survey questions={surveyQuestions} />
      ) : (
        <Paper elevation={0} sx={{ ...cardSx, p: 3, textAlign: "center" }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              mx: "auto",
              mb: 2,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(46, 125, 50, 0.12)",
            }}
          >
            <CheckCircleOutlineIcon sx={{ fontSize: 32, color: "success.main" }} />
          </Box>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            You&apos;re all caught up!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.55 }}>
            You&apos;ve completed this week&apos;s survey. Your next check-in opens on{" "}
            <strong>{nextSurveyDate}</strong>.
          </Typography>
          <Stack spacing={1.25}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/log")}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, py: 1.1 }}
            >
              Go to food log
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<EventAvailableOutlinedIcon />}
              onClick={() => navigate("/tasks")}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, py: 1.1 }}
            >
              View daily tasks
            </Button>
          </Stack>
        </Paper>
      )}
    </PageWrapper>
  );
}

export default QaPage;
