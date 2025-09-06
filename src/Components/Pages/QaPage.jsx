import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { surveyAPI } from "../../api";
import { useNavigate, useSearchParams } from "react-router-dom";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import weekOfYear from "dayjs/plugin/weekOfYear";

import Survey from "../Survey";
import {
  Box,
  Button,
  Typography,
  Container,
  CircularProgress,
} from "@mui/material";

dayjs.extend(weekOfYear);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

function QaPage({ setShowSurvey }) {
  const [surveyQuestions, setSurveyQuestions] = useState(null);
  const [initialCompleted, setInitialCompleted] = useState(false);
  const [lastWeeklyCompletion, setLastWeeklyCompletion] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stageParam = searchParams.get('stage');

  useEffect(() => {
    const fetchSurveyStatus = async () => {
      try {
        setLoadingStatus(true);
        const userId = localStorage.getItem("userId");
        const res = await surveyAPI.getSurveyStatus(userId);

        setInitialCompleted(res.data.initialCompleted);
        setLastWeeklyCompletion(res.data.lastWeeklyCompletion);

        // If stage parameter is provided, use it (for initial survey redirect)
        if (stageParam) {
          const qRes = await surveyAPI.getSurveyQuestions({ stage: stageParam });
          setSurveyQuestions(qRes.data);
        } else {
          // Only fetch questions if initial not completed OR last weekly completion is not this week
          const completedThisWeek =
            res.data.lastWeeklyCompletion &&
            dayjs(res.data.lastWeeklyCompletion).week() === dayjs().week() &&
            dayjs(res.data.lastWeeklyCompletion).year() === dayjs().year();

          if (!res.data.initialCompleted || !completedThisWeek) {
            const stage = res.data.initialCompleted ? "weekly" : "initial";
            const qRes = await surveyAPI.getSurveyQuestions({ stage });
            setSurveyQuestions(qRes.data);
          } else {
            setSurveyQuestions([]); // empty to indicate no questions this week
          }
        }

        setErrorStatus(null);
      } catch (err) {
        console.error("Failed to load survey status:", err);
        setErrorStatus("Failed to load survey status.");
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchSurveyStatus();
  }, []);

  // Calculate next week start date (assuming Monday)
  const nextSurveyDate = dayjs().startOf("week").add(1, "week").format("MMM D, YYYY");

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        bgcolor: "background.default",
        zIndex: 1300,
        overflowY: "auto",
        py: 4,
        color: "black",
      }}
    >
      <Container maxWidth="sm">
        {/* Top Bar */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={2}
          sx={{ px: { xs: 2, sm: 0 } }}
        >
          <Typography variant="h6">Survey</Typography>
          <Button 
            variant="outlined" 
            onClick={() => {
              if (setShowSurvey) {
                setShowSurvey(false);
              } else {
                navigate("/home");
              }
            }}
          >
            Back
          </Button>
        </Box>

        {loadingStatus ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={3}>
            <CircularProgress />
          </Box>
        ) : errorStatus ? (
          <Typography color="error">{errorStatus}</Typography>
        ) : surveyQuestions?.length > 0 ? (
          <Survey questions={surveyQuestions} />
        ) : (
          <Box mt={4} textAlign="center">
            <Typography variant="h6" gutterBottom>
              You have completed this week’s survey. 🎉
            </Typography>
            <Typography variant="body1">
              Please come back on <strong>{nextSurveyDate}</strong> to complete the next survey.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default QaPage;
