// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import dayjs from "dayjs";
import { foodPurchaseAPI } from "../../api";
import { useSessionData } from "../../hooks/useSessionData";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  Button,
  Box,
  Typography,
  Dialog,
  Paper,
  Stack,
  Chip,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import RefreshIcon from "@mui/icons-material/Refresh";
import { getCurrentUserId } from "../../utils/authUtils";
import AddNewPurchase from "./AddNewPurchase";
import DateNavigator from "../DateNavigator";
import FoodPurchaseList from "../FoodPurchaseList";
import PageWrapper from "../PageWrapper";
import { primaryAlpha } from "../../themeColors";
import DailyTasksPopup from "../DailyTasksPopup";
import { useIsTabActive } from "../../context/TabVisibilityContext";
import {
  shouldOfferDailyTasksPopup,
  SURVEY_REMINDER_CLOSE,
  SURVEY_REMINDER_OPEN,
} from "../../utils/reminderUtils";

const cardSx = {
  borderRadius: 3,
  border: "none",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
  backgroundColor: "white",
};

const FoodLog = () => {
  const isTabActive = useIsTabActive();
  const isTabActiveRef = useRef(isTabActive);
  isTabActiveRef.current = isTabActive;
  const hasFetchedRef = useRef(false);

  const [foodPurchases, setFoodPurchases] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loggingPurchase, setLoggingPurchase] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const [selectedDate, setSelectedDate] = useState(() =>
    dateParam && dayjs(dateParam, "YYYY-MM-DD", true).isValid()
      ? dayjs(dateParam, "YYYY-MM-DD")
      : dayjs()
  );
  const { data: sessionData } = useSessionData();
  const [showDailyTasksPopup, setShowDailyTasksPopup] = useState(false);
  const [surveyReminderBlocking, setSurveyReminderBlocking] = useState(false);
  const navigate = useNavigate();

  const tryShowDailyTasksPopup = useCallback(() => {
    if (!isTabActiveRef.current || surveyReminderBlocking) {
      setShowDailyTasksPopup(false);
      return;
    }

    const userId = getCurrentUserId();
    if (!userId || !sessionData) return;

    const shouldShow = shouldOfferDailyTasksPopup({
      userId,
      surveyStatus: sessionData.surveyStatus,
      tasks: sessionData.todayTasks,
      surveyReminderBlocking,
    });

    setShowDailyTasksPopup(shouldShow);
  }, [sessionData, surveyReminderBlocking]);

  const datesWithFood = useMemo(
    () => [
      ...new Set(
        foodPurchases.map((p) => dayjs(p.purchase_date).format("YYYY-MM-DD"))
      ),
    ],
    [foodPurchases]
  );

  const fetchFoodItems = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
      const response = await foodPurchaseAPI.getFoodItems({ user_id: userId });
      setFoodItems(response.data || []);
    } catch (error) {
      console.error("Error fetching food items:", error);
    }
  };

  const fetchFoodPurchases = useCallback(async (showLoader = false) => {
    const userId = getCurrentUserId();
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      if (showLoader) setLoading(true);
      const response = await foodPurchaseAPI.getFoodPurchases({ user_id: userId });
      setFoodPurchases(response.data || []);
    } catch (error) {
      console.error("Error fetching food purchases:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePurchase = async (purchaseId) => {
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
      await foodPurchaseAPI.deletePurchase(purchaseId, { user_id: userId });
      fetchFoodPurchases();
    } catch (error) {
      console.error("Error deleting purchase:", error);
    }
  };

  useEffect(() => {
    if (!isTabActive || !getCurrentUserId()) return;

    const showLoader = !hasFetchedRef.current;
    fetchFoodPurchases(showLoader);
    fetchFoodItems();
    hasFetchedRef.current = true;
  }, [isTabActive, fetchFoodPurchases]);

  useEffect(() => {
    const onLogin = () => {
      if (!isTabActiveRef.current) return;
      hasFetchedRef.current = false;
      fetchFoodPurchases(true);
      fetchFoodItems();
      hasFetchedRef.current = true;
    };

    window.addEventListener("sessionLogin", onLogin);
    return () => window.removeEventListener("sessionLogin", onLogin);
  }, [fetchFoodPurchases]);

  // Only touch the URL while this tab is visible — otherwise a kept-alive FoodLog
  // will re-apply ?date= onto /survey (and other routes) whenever setSearchParams changes.
  useEffect(() => {
    if (!isTabActive) return;

    const param = searchParams.get("date");
    if (param && dayjs(param, "YYYY-MM-DD", true).isValid()) {
      const fromUrl = dayjs(param, "YYYY-MM-DD");
      if (!fromUrl.isSame(selectedDate, "day")) {
        setSelectedDate(fromUrl);
        return;
      }
    }

    const dateStr = selectedDate.format("YYYY-MM-DD");
    if (param !== dateStr) {
      setSearchParams({ date: dateStr }, { replace: true });
    }
  }, [isTabActive, selectedDate, searchParams, setSearchParams]);

  useEffect(() => {
    tryShowDailyTasksPopup();
  }, [tryShowDailyTasksPopup, sessionData]);

  useEffect(() => {
    const onSurveyOpen = () => {
      setSurveyReminderBlocking(true);
      setShowDailyTasksPopup(false);
    };
    const onSurveyClose = () => {
      setSurveyReminderBlocking(false);
      tryShowDailyTasksPopup();
    };

    window.addEventListener(SURVEY_REMINDER_OPEN, onSurveyOpen);
    window.addEventListener(SURVEY_REMINDER_CLOSE, onSurveyClose);
    return () => {
      window.removeEventListener(SURVEY_REMINDER_OPEN, onSurveyOpen);
      window.removeEventListener(SURVEY_REMINDER_CLOSE, onSurveyClose);
    };
  }, [tryShowDailyTasksPopup]);

  useEffect(() => {
    if (!isTabActive) {
      setShowDailyTasksPopup(false);
      setLoggingPurchase(false);
    }
  }, [isTabActive]);

  useEffect(() => {
    const handleTaskCompleted = () => {
      fetchFoodPurchases();
      tryShowDailyTasksPopup();
    };
    window.addEventListener("taskCompleted", handleTaskCompleted);
    return () => window.removeEventListener("taskCompleted", handleTaskCompleted);
  }, [tryShowDailyTasksPopup]);

  const filteredPurchases = useMemo(
    () =>
      foodPurchases.filter((purchase) =>
        dayjs(purchase.purchase_date).isSame(selectedDate, "day")
      ),
    [foodPurchases, selectedDate]
  );

  const dayTotal = useMemo(
    () =>
      filteredPurchases.reduce(
        (sum, p) => sum + (Number.parseFloat(p.price) || 0),
        0
      ),
    [filteredPurchases]
  );

  const isWithin7Days = dayjs()
    .subtract(7, "day")
    .isSameOrBefore(selectedDate, "day");
  const isDateInFuture = selectedDate.isAfter(dayjs(), "day");
  const canModify = isWithin7Days && !isDateInFuture;
  const isToday = selectedDate.isSame(dayjs(), "day");

  return (
    <PageWrapper title="Food Log" showLogo>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Paper elevation={0} sx={{ ...cardSx, p: 2, mb: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1.5 }}
          >
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              Select day
            </Typography>
            <IconButton
              size="small"
              aria-label="Refresh log"
              onClick={() => fetchFoodPurchases(true)}
              disabled={loading}
              sx={{
                backgroundColor: "rgba(0, 0, 0, 0.04)",
                "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.08)" },
              }}
            >
              {loading ? (
                <CircularProgress size={18} />
              ) : (
                <RefreshIcon fontSize="small" />
              )}
            </IconButton>
          </Stack>

          <DateNavigator
            value={selectedDate}
            onChange={setSelectedDate}
            datesWithFood={datesWithFood}
          />

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 2, pt: 1.5, borderTop: "1px solid rgba(0,0,0,0.06)" }}
          >
            <Box>
              <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
                ${dayTotal.toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {filteredPurchases.length}{" "}
                {filteredPurchases.length === 1 ? "item" : "items"}
                {isToday ? " today" : ""}
              </Typography>
            </Box>
            {!canModify && (
              <Chip
                label="View only"
                size="small"
                sx={{
                  fontWeight: 600,
                  backgroundColor: "rgba(0, 0, 0, 0.06)",
                }}
              />
            )}
          </Stack>

          <Button
            variant="contained"
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => setLoggingPurchase(true)}
            disabled={!canModify}
            sx={{
              mt: 2,
              borderRadius: 2.5,
              textTransform: "none",
              fontWeight: 600,
              py: 1.25,
            }}
          >
            Add food
          </Button>

          {!canModify && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", textAlign: "center", mt: 1 }}
            >
              You can only add or remove items from the last 7 days.
            </Typography>
          )}
        </Paper>

        {loading && foodPurchases.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredPurchases.length > 0 ? (
          <FoodPurchaseList
            deletePurchase={deletePurchase}
            purchases={filteredPurchases}
            canModify={canModify}
          />
        ) : (
          <Paper
            elevation={0}
            sx={{
              ...cardSx,
              py: 5,
              px: 3,
              textAlign: "center",
            }}
          >
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
                backgroundColor: primaryAlpha(0.1),
              }}
            >
              <RestaurantIcon sx={{ fontSize: 28, color: "primary.main" }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Nothing logged yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              {isToday
                ? "Use Add food above to log what you bought today."
                : `No purchases recorded for ${selectedDate.format("MMMM D")}.`}
            </Typography>
          </Paper>
        )}
      </LocalizationProvider>

      <Dialog
        open={loggingPurchase && isTabActive}
        onClose={() => setLoggingPurchase(false)}
        fullScreen
        sx={{ zIndex: 1500 }}
      >
        <AddNewPurchase
          setLoggingPurchase={setLoggingPurchase}
          foodItems={foodItems}
          fetchFoodItems={fetchFoodItems}
          fetchFoodPurchases={fetchFoodPurchases}
          selectedDate={selectedDate}
        />
      </Dialog>

      <DailyTasksPopup
        open={showDailyTasksPopup && isTabActive && !surveyReminderBlocking}
        onClose={() => setShowDailyTasksPopup(false)}
        onDismissForToday={() => setShowDailyTasksPopup(false)}
        onViewAllTasks={() => navigate("/tasks")}
      />
    </PageWrapper>
  );
};

export default FoodLog;
