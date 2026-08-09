import React, { useEffect, useState, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import { surveyAPI } from "../../api";
import { useNavigate, useSearchParams } from "react-router-dom";
import weekOfYear from "dayjs/plugin/weekOfYear";

import Survey from "../Survey";
import SurveyMap from "../SurveyProgressMap/SurveyMap";
import { buildCheckpointModels } from "../SurveyProgressMap/pathUtils";
import AppConfirmDialog from "../AppConfirmDialog";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Button,
  Stack,
  IconButton,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PageWrapper from "../PageWrapper";
import { getCurrentUserId } from "../../utils/authUtils";
import { colors } from "../../themeColors";

dayjs.extend(weekOfYear);

const cardSx = {
  borderRadius: 3,
  border: "none",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
  backgroundColor: "white",
};

function resolveWeeklyCompletedCount(status) {
  if (typeof status?.weeklyCompletedCount === "number") {
    return status.weeklyCompletedCount;
  }
  return status?.lastWeeklyCompletion ? 1 : 0;
}

function isWeeklyDoneThisWeek(status) {
  return Boolean(
    status?.lastWeeklyCompletion &&
      dayjs(status.lastWeeklyCompletion).week() === dayjs().week() &&
      dayjs(status.lastWeeklyCompletion).year() === dayjs().year()
  );
}

function completionCopy(stage) {
  const key = String(stage || "").toLowerCase();
  if (key === "weekly") {
    return {
      title: "Weekly survey complete",
      message: "Nice work — your journey map is updated.",
    };
  }
  if (key === "initial") {
    return {
      title: "Initial survey complete",
      message: "You're on the path. Tap the pulsing checkpoint when your next check-in is ready.",
    };
  }
  if (key === "final") {
    return {
      title: "Final survey complete",
      message: "You've reached the end of the survey journey. Thank you!",
    };
  }
  return {
    title: "Survey complete",
    message: "Your responses have been saved.",
  };
}

/** @returns {{ canOpen: boolean, messageTitle: string, message: string, stage?: string }} */
function evaluateCheckpoint(checkpoint, status) {
  if (!checkpoint || !status) {
    return {
      canOpen: false,
      messageTitle: "Not available yet",
      message: "Come back later for another survey.",
    };
  }

  if (checkpoint.status === "completed") {
    return {
      canOpen: false,
      messageTitle: "Already completed",
      message:
        checkpoint.kind === "final"
          ? "You've already finished the final survey."
          : `Week ${checkpoint.week} is already done. Come back later for another check-in.`,
    };
  }

  if (checkpoint.status === "locked") {
    return {
      canOpen: false,
      messageTitle: "Not available yet",
      message: "Come back later for another survey.",
    };
  }

  // status === current or upcoming
  if (checkpoint.status === "upcoming") {
    return {
      canOpen: false,
      messageTitle: "Not available yet",
      message: "Come back later for another survey.",
    };
  }

  if (checkpoint.kind === "final") {
    return {
      canOpen: true,
      stage: "final",
      messageTitle: "",
      message: "",
    };
  }

  if (Boolean(status.weeklyDue) && !isWeeklyDoneThisWeek(status)) {
    return {
      canOpen: true,
      stage: "weekly",
      messageTitle: "",
      message: "",
    };
  }

  return {
    canOpen: false,
    messageTitle: "Not available yet",
    message: "Come back later for another survey.",
  };
}

function QaPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const stageParam = searchParams.get("stage");

  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);

  const [mode, setMode] = useState("map"); // 'map' | 'survey'
  const [surveyQuestions, setSurveyQuestions] = useState(null);
  const [activeStage, setActiveStage] = useState(null);
  const [loadingSurvey, setLoadingSurvey] = useState(false);

  const [infoDialog, setInfoDialog] = useState(null);
  const [completedStage, setCompletedStage] = useState(null);

  const loadStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const userId = getCurrentUserId();
      if (!userId) {
        setErrorStatus("You must be logged in to view surveys.");
        setLoadingStatus(false);
        return null;
      }
      const res = await surveyAPI.getSurveyStatus(userId);
      setStatus(res.data);
      setErrorStatus(null);
      return res.data;
    } catch (err) {
      console.error("Failed to load survey status:", err);
      setErrorStatus("Failed to load survey status.");
      return null;
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const openSurvey = useCallback(async (stage) => {
    try {
      setLoadingSurvey(true);
      const qRes = await surveyAPI.getSurveyQuestions({ stage });
      setSurveyQuestions(qRes.data || []);
      setActiveStage(stage);
      setMode("survey");
    } catch (err) {
      console.error("Failed to load survey questions:", err);
      setInfoDialog({
        title: "Couldn't open survey",
        message: "Please try again in a moment.",
      });
    } finally {
      setLoadingSurvey(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await loadStatus();
      if (cancelled || !data) return;

      // Deep links: ?stage= only open when that stage is actually available
      if (stageParam === "initial" && !data.initialCompleted) {
        await openSurvey("initial");
        setSearchParams({}, { replace: true });
        return;
      }
      if (stageParam === "weekly") {
        const fakeCurrent = { status: "current", kind: "week", week: 1 };
        const verdict = evaluateCheckpoint(fakeCurrent, data);
        if (verdict.canOpen) {
          await openSurvey("weekly");
        } else {
          setInfoDialog({
            title: verdict.messageTitle || "Not available yet",
            message: verdict.message || "Come back later for another survey.",
          });
        }
        setSearchParams({}, { replace: true });
        return;
      }
      if (stageParam === "final") {
        const weeksDone = resolveWeeklyCompletedCount(data);
        const total = data.totalStudyWeeks ?? 8;
        let finalStatus = "locked";
        if (data.finalCompleted) finalStatus = "completed";
        else if (data.finalTriggered || weeksDone >= total) finalStatus = "current";
        const verdict = evaluateCheckpoint(
          { status: finalStatus, kind: "final" },
          data
        );
        if (verdict.canOpen) {
          await openSurvey("final");
        } else {
          setInfoDialog({
            title: verdict.messageTitle || "Not available yet",
            message: verdict.message || "Come back later for another survey.",
          });
        }
        setSearchParams({}, { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadStatus, openSurvey, setSearchParams, stageParam]);

  const checkpoints = useMemo(() => {
    if (!status) return [];
    return buildCheckpointModels({
      totalStudyWeeks: status.totalStudyWeeks ?? 8,
      weeklyCompletedCount: resolveWeeklyCompletedCount(status),
      initialCompleted: Boolean(status.initialCompleted),
      finalTriggered: Boolean(status.finalTriggered),
      finalCompleted: Boolean(status.finalCompleted),
      weeklyDue: Boolean(status.weeklyDue),
    });
  }, [status]);

  const completedWeeks = resolveWeeklyCompletedCount(status);
  const totalWeeks = status?.totalStudyWeeks ?? 8;

  const handleSelectCheckpoint = (checkpoint) => {
    const verdict = evaluateCheckpoint(checkpoint, status);
    if (verdict.canOpen && verdict.stage) {
      openSurvey(verdict.stage);
      return;
    }
    setInfoDialog({
      title: verdict.messageTitle,
      message: verdict.message,
    });
  };

  const handleBackToMap = () => {
    setMode("map");
    setSurveyQuestions(null);
    setActiveStage(null);
    loadStatus();
  };

  const handleSurveyComplete = useCallback(
    async (stage) => {
      setCompletedStage(stage || activeStage || "weekly");
      setMode("map");
      setSurveyQuestions(null);
      setActiveStage(null);
      await loadStatus();
    },
    [activeStage, loadStatus]
  );

  const doneCopy = completionCopy(completedStage);

  const pageTitle =
    mode === "survey"
      ? activeStage === "initial"
        ? "Initial survey"
        : activeStage === "final"
          ? "Final survey"
          : "Weekly check-in"
      : "Survey journey";

  return (
    <PageWrapper
      title={pageTitle}
      headerAction={
        mode === "survey" ? (
          <IconButton
            aria-label="Back to map"
            onClick={handleBackToMap}
            size="small"
            sx={{ color: "primary.main" }}
          >
            <ArrowBackIcon />
          </IconButton>
        ) : null
      }
    >
      {loadingStatus && mode === "map" ? (
        <Box display="flex" flexDirection="column" alignItems="center" py={6}>
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading your map…
          </Typography>
        </Box>
      ) : errorStatus && mode === "map" ? (
        <Paper elevation={0} sx={{ ...cardSx, p: 3, textAlign: "center" }}>
          <Typography color="error" fontWeight={600} gutterBottom>
            {errorStatus}
          </Typography>
          <Button
            variant="outlined"
            onClick={loadStatus}
            sx={{ mt: 1, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Try again
          </Button>
        </Paper>
      ) : mode === "survey" ? (
        loadingSurvey ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={6}>
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Opening survey…
            </Typography>
          </Box>
        ) : surveyQuestions?.length > 0 ? (
          <Survey questions={surveyQuestions} onComplete={handleSurveyComplete} />
        ) : (
          <Paper elevation={0} sx={{ ...cardSx, p: 3, textAlign: "center" }}>
            <Typography color="error" fontWeight={600} gutterBottom>
              No questions found for this survey.
            </Typography>
            <Button
              variant="outlined"
              onClick={handleBackToMap}
              sx={{ mt: 1, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Back to map
            </Button>
          </Paper>
        )
      ) : (
        <Stack spacing={2}>
          <Paper elevation={0} sx={{ ...cardSx, p: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: colors.text }}>
              {status?.finalCompleted
                ? "Study complete — nice work!"
                : !status?.initialCompleted
                  ? "Start with the initial survey to unlock your path."
                  : `${completedWeeks} of ${totalWeeks} weekly check-ins done`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
              Tap a pulsing checkpoint to take that survey. Locked nodes open later.
            </Typography>
          </Paper>

          <SurveyMap checkpoints={checkpoints} onSelectCheckpoint={handleSelectCheckpoint} />

          {!status?.initialCompleted && (
            <Button
              variant="contained"
              fullWidth
              onClick={() => openSurvey("initial")}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, py: 1.1 }}
            >
              Start initial survey
            </Button>
          )}
        </Stack>
      )}

      <AppConfirmDialog
        open={Boolean(infoDialog)}
        onClose={() => setInfoDialog(null)}
        tone="default"
        icon={<InfoOutlinedIcon />}
        title={infoDialog?.title || "Not available yet"}
        maxWidth="xs"
        presentation="centered"
        zIndex={1600}
        primaryAction={{
          label: "OK",
          onClick: () => setInfoDialog(null),
        }}
      >
        {infoDialog?.message || "Come back later for another survey."}
      </AppConfirmDialog>

      <AppConfirmDialog
        open={Boolean(completedStage)}
        onClose={() => setCompletedStage(null)}
        tone="success"
        icon={<CheckCircleOutlineIcon />}
        title={doneCopy.title}
        maxWidth="sm"
        presentation="centered"
        zIndex={1600}
        primaryAction={{
          label: "Back to map",
          onClick: () => setCompletedStage(null),
        }}
        secondaryAction={{
          label: "Go to food log",
          onClick: () => {
            setCompletedStage(null);
            navigate("/log");
          },
        }}
      >
        {doneCopy.message}
      </AppConfirmDialog>
    </PageWrapper>
  );
}

export default QaPage;
