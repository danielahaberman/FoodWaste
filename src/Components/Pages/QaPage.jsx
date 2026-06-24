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
  Typography,
  CircularProgress,
} from "@mui/material";
import PageWrapper from "../PageWrapper";
import { getCurrentUserId } from "../../utils/authUtils";

dayjs.extend(weekOfYear);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

function QaPage() {
  const [surveyQuestions, setSurveyQuestions] = useState(null);
  const [initialCompleted, setInitialCompleted] = useState(false);
  const [lastWeeklyCompletion, setLastWeeklyCompletion] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stageParam = searchParams.get('stage');

  const fetchSurveyStatus = async () => {
    try {
      setLoadingStatus(true);
      const userId = getCurrentUserId();
      if (!userId) {
        setErrorStatus("You must be logged in to view surveys.");
        setLoadingStatus(false);
        return;
      }
      const res = await surveyAPI.getSurveyStatus(userId);

      setInitialCompleted(res.data.initialCompleted);
      setLastWeeklyCompletion(res.data.lastWeeklyCompletion);

      if (stageParam) {
        const qRes = await surveyAPI.getSurveyQuestions({ stage: stageParam });
        setSurveyQuestions(qRes.data);
      } else {
        const completedThisWeek =
          res.data.lastWeeklyCompletion &&
          dayjs(res.data.lastWeeklyCompletion).week() === dayjs().week() &&
          dayjs(res.data.lastWeeklyCompletion).year() === dayjs().year();

        if (!res.data.initialCompleted || !completedThisWeek) {
          const stage = res.data.initialCompleted ? "weekly" : "initial";
          const qRes = await surveyAPI.getSurveyQuestions({ stage });
          setSurveyQuestions(qRes.data);
        } else {
          setSurveyQuestions([]);
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

  useEffect(() => {
    fetchSurveyStatus();
  }, []);

  // Calculate next week start date (assuming Monday)
  const nextSurveyDate = dayjs().startOf("week").add(1, "week").format("MMM D, YYYY");

  return (
    <PageWrapper title="Survey">
        {loadingStatus ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={5}>
            <CircularProgress />
          </Box>
        ) : errorStatus ? (
          <Typography 
            color="error"
            sx={{ 
              fontSize: '1rem',
              fontWeight: 500,
              textAlign: 'center',
              py: 2
            }}
          >
            {errorStatus}
          </Typography>
        ) : surveyQuestions?.length > 0 ? (
          <Survey questions={surveyQuestions} />
        ) : (
          <Box 
            mt={4} 
            textAlign="center"
            sx={{
              p: { xs: 4, sm: 5 },
              backgroundColor: 'white',
              borderRadius: 4,
              border: 'none',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)'
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{
                fontSize: { xs: '1.2rem', sm: '1.4rem' },
                fontWeight: 600,
                mb: 2,
                color: 'rgba(0, 0, 0, 0.85)'
              }}
            >
              You have completed this week's survey. 🎉
            </Typography>
            <Typography 
              variant="body1"
              sx={{
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                lineHeight: 1.6,
                color: 'rgba(0, 0, 0, 0.7)'
              }}
            >
              Please come back on <strong style={{ fontWeight: 600 }}>{nextSurveyDate}</strong> to complete the next survey.
            </Typography>
          </Box>
        )}
    </PageWrapper>
  );
}

export default QaPage;
