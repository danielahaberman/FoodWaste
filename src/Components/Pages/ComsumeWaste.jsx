import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { foodPurchaseAPI, consumptionAPI } from "../../api";
import moment from "moment-timezone";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  LinearProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import PageWrapper from "../PageWrapper";
import AppConfirmDialog from "../AppConfirmDialog";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "../../utils/authUtils";
import { useIsTabActive } from "../../context/TabVisibilityContext";
import SwipeableViews from 'react-swipeable-views';
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import CloseIcon from "@mui/icons-material/Close";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import { Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";

ChartJS.register(ArcElement, ChartTooltip, CategoryScale, LinearScale, PointElement, LineElement);

const cardSx = {
  borderRadius: 3,
  border: "none",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
  backgroundColor: "white",
};

function computeWeekStats(week, summaryMap) {
  let completedItems = 0;
  let consumedQty = 0;
  let wastedQty = 0;
  let consumedCost = 0;
  let wastedCost = 0;
  let totalSpent = 0;
  const itemCount = week.purchases.length;

  week.purchases.forEach((purchase) => {
    const s = summaryMap[purchase.id] || {};
    const baseQty = parseFloat(purchase.quantity) || 0;
    const price = parseFloat(purchase.price) || 0;
    totalSpent += price;
    const cQty = parseFloat(s.consumed_qty || 0);
    const wQty = parseFloat(s.wasted_qty || 0);
    consumedQty += cQty;
    wastedQty += wQty;
    consumedCost += parseFloat(s.consumed_cost || 0);
    wastedCost += parseFloat(s.wasted_cost || 0);
    if (cQty + wQty >= baseQty - 0.0001) completedItems += 1;
  });

  const progress = itemCount > 0 ? Math.round((completedItems / itemCount) * 100) : 0;
  const isCompleted = itemCount > 0 && completedItems === itemCount;
  const isEmpty = itemCount === 0;

  return {
    itemCount,
    consumedQty,
    wastedQty,
    consumedCost,
    wastedCost,
    totalSpent,
    progress,
    isCompleted,
    isEmpty,
  };
}

function SummaryLegend() {
  const items = [
    { Icon: ShoppingCartIcon, label: "Purchased", color: "primary.main" },
    { Icon: RestaurantIcon, label: "Consumed", color: "success.main" },
    { Icon: DeleteForeverIcon, label: "Wasted", color: "error.main" },
  ];

  return (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      {items.map(({ Icon, label, color }) => (
        <Chip
          key={label}
          size="small"
          icon={<Icon sx={{ fontSize: "16px !important", color: `${color} !important` }} />}
          label={label}
          sx={{
            height: 28,
            fontWeight: 600,
            fontSize: "0.75rem",
            backgroundColor: "rgba(0, 0, 0, 0.04)",
            border: "none",
          }}
        />
      ))}
    </Stack>
  );
}

const LOG_WIZARD_STEP_COUNT = 3;
const LOG_WIZARD_STEP_LABELS = ["Choose", "Amount", "The rest"];

const LOG_PERCENT_OPTIONS = [
  { label: "¼", pct: 0.25 },
  { label: "Half", pct: 0.5 },
  { label: "¾", pct: 0.75 },
  { label: "All", pct: 1 },
];

const INITIAL_LOG_WIZARD = { step: 1, type: null, amount: 0 };

function amountFromPercent(remaining, pct) {
  if (pct >= 1) return remaining;
  return Number(Math.max(0, remaining * pct).toFixed(4));
}

function PartialLogWizardProgress({ currentStep }) {
  const progress = (currentStep / LOG_WIZARD_STEP_COUNT) * 100;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={700}>
          Step {currentStep} of {LOG_WIZARD_STEP_COUNT}
        </Typography>
        <Typography variant="caption" color="primary.main" fontWeight={700}>
          {LOG_WIZARD_STEP_LABELS[currentStep - 1]}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 5,
          borderRadius: 3,
          backgroundColor: "rgba(0, 0, 0, 0.08)",
        }}
      />
    </Box>
  );
}

function WizardStepTitle({ children }) {
  return (
    <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.35 }}>
      {children}
    </Typography>
  );
}

function ItemProgressBar({ base, consumedSoFar, wastedSoFar }) {
  return (
    <Box
      sx={{
        display: "flex",
        height: 8,
        borderRadius: 4,
        overflow: "hidden",
        bgcolor: "rgba(0,0,0,0.08)",
      }}
    >
      <Box
        sx={{
          width: `${base > 0 ? (consumedSoFar / base) * 100 : 0}%`,
          bgcolor: "success.main",
        }}
      />
      <Box
        sx={{
          width: `${base > 0 ? (wastedSoFar / base) * 100 : 0}%`,
          bgcolor: "error.main",
        }}
      />
      <Box sx={{ flex: 1, bgcolor: "primary.light", opacity: 0.35 }} />
    </Box>
  );
}

function WeekStat({ Icon, label, value, color }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0, textAlign: "center" }}>
      <Icon sx={{ fontSize: 20, color, mb: 0.25 }} />
      <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} noWrap sx={{ lineHeight: 1.3 }}>
        {value}
      </Typography>
    </Box>
  );
}

function ConsumeWaste({ onGoToDate }) {
  const navigate = useNavigate();
  const isTabActive = useIsTabActive();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [logWizard, setLogWizard] = useState(INITIAL_LOG_WIZARD);
  const [logSaving, setLogSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [summaryMap, setSummaryMap] = useState({});
  const [weekCharts, setWeekCharts] = useState({});
  const [weekChartTotals, setWeekChartTotals] = useState({});
  const [trendData, setTrendData] = useState(null);
  const [overallChart, setOverallChart] = useState(null);
  const [overallTotals, setOverallTotals] = useState(null);
  const [overallOpen, setOverallOpen] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState('day');
  const [trendOffset, setTrendOffset] = useState(0);
  const [tabIndex, setTabIndex] = useState(0);
  const [activeWeekOf, setActiveWeekOf] = useState(null);
  const [byCategory, setByCategory] = useState([]);

  const refreshAll = useCallback(async (showLoader = false) => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError("You must be logged in to view this data.");
      setLoading(false);
      return;
    }

    if (showLoader) setLoading(true);
    setError(null);
    try {
      const response = await foodPurchaseAPI.getWeeklySummary({ user_id: userId });
      const data = response.data || [];
      setWeeklySummary(data);
      const ids = data.flatMap((w) => w.purchases).map((p) => p.id);
      if (ids.length) {
        const res = await consumptionAPI.getBatchSummary({
          user_id: userId,
          purchase_ids: ids.join(","),
        });
        const map = {};
        (res.data || []).forEach((r) => {
          map[r.purchase_id] = r;
        });
        setSummaryMap(map);
      } else {
        setSummaryMap({});
      }
    } catch (err) {
      console.error("Error fetching weekly summary:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWeeklyPurchaseSummary = async () => {
    await refreshAll(true);
  };

  useEffect(() => {
    refreshAll(false);
  }, [refreshAll]);

  useEffect(() => {
    const handleDataUpdate = () => refreshAll(false);
    window.addEventListener('taskCompleted', handleDataUpdate);
    return () => window.removeEventListener('taskCompleted', handleDataUpdate);
  }, [refreshAll]);

  useEffect(() => {
    if (!isTabActive) {
      setSelectedPurchase(null);
      setLogWizard(INITIAL_LOG_WIZARD);
      setOverallOpen(false);
    }
  }, [isTabActive]);

  const purchasesFlat = useMemo(() => weeklySummary.flatMap(w => w.purchases), [weeklySummary]);

  const fetchBatchSummaries = async () => {
    const userId = getCurrentUserId();
    if (!userId || !purchasesFlat.length) return {};
    const ids = purchasesFlat.map(p => p.id).join(",");
    const res = await consumptionAPI.getBatchSummary({ user_id: userId, purchase_ids: ids });
    const map = {};
    (res.data || []).forEach(r => { map[r.purchase_id] = r; });
    return map;
  };

  // Sunday-based weeks to match server weekly-summary grouping
  const getEditableWeeks = () => {
    const now = moment.tz('America/New_York');
    const currentWeek = now.clone().subtract(now.day(), 'days').startOf('day');
    const previousWeek = currentWeek.clone().subtract(1, 'week');
    const nextWeek = currentWeek.clone().add(1, 'week');
    
    return {
      previousWeek: previousWeek.format('MM/DD/YYYY'),
      currentWeek: currentWeek.format('MM/DD/YYYY'),
      nextWeek: nextWeek.format('MM/DD/YYYY')
    };
  };

  // Helper function to format week date range
  const formatWeekRange = (weekStart) => {
    const start = moment.tz(weekStart, 'MM/DD/YYYY', 'America/New_York');
    const end = start.clone().add(6, 'days');
    return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
  };

  const isWeekEditable = (weekOf) => {
    const editableWeeks = getEditableWeeks();
    return (
      weekOf === editableWeeks.previousWeek || weekOf === editableWeeks.currentWeek
    );
  };

  const getItemEmoji = (item) => {
    if (item.emoji) return item.emoji;
    const map = {
      Fruits: "🍎", Vegetables: "🥦", Bakery: "🍞", Dairy: "🥛", Meat: "🥩", Seafood: "🐟",
      Grains: "🌾", "Canned Goods": "🥫", Frozen: "🧊", Beverages: "🥤", Juice: "🧃",
      Snacks: "🍿", Condiments: "🧂", Spices: "🧂", Pantry: "📦", Deli: "🥪",
      "Prepared Foods": "🍱", Breakfast: "🍳", Sauces: "🍝", Baking: "🧁",
      "Oils & Vinegars": "🫒", Household: "🏠",
    };
    return map[item.category] || "🍽️";
  };

  const getPurchaseBreakdown = (purchase, summary = {}) => {
    const base = parseFloat(purchase.quantity) || 0;
    const consumed = parseFloat(summary.consumed_qty || 0) || 0;
    const wasted = parseFloat(summary.wasted_qty || 0) || 0;
    const used = consumed + wasted;
    const remaining = Math.max(0, base - used);
    const completed = remaining <= 0.0001;
    const pctConsumed = base > 0 ? (consumed / base) * 100 : 0;
    const pctWasted = base > 0 ? (wasted / base) * 100 : 0;
    const pctRemaining = base > 0 ? (remaining / base) * 100 : 0;
    return {
      base,
      consumed,
      wasted,
      remaining,
      completed,
      pctConsumed,
      pctWasted,
      pctRemaining,
      consumedCost: parseFloat(summary.consumed_cost || 0) || 0,
      wastedCost: parseFloat(summary.wasted_cost || 0) || 0,
    };
  };

  const formatNum = (n) => {
    const v = parseFloat(n || 0);
    if (Number.isNaN(v)) return "0.00";
    const rounded = Math.round(v * 100) / 100;
    return rounded.toFixed(2);
  };

  const formatMoney = (n) => `$${formatNum(n)}`;

  const goToLogForWeek = (weekOf) => {
    const weekStart = moment.tz(weekOf, "MM/DD/YYYY", "America/New_York");
    navigate(`/log?date=${weekStart.format("YYYY-MM-DD")}`);
  };

  const refreshAfterLog = async () => {
    await fetchWeeklyPurchaseSummary();
    const m = await fetchBatchSummaries();
    setSummaryMap(m);
    if (activeWeekOf) {
      await ensureWeekChart(activeWeekOf, true);
    }
    window.dispatchEvent(new CustomEvent("taskCompleted"));
  };

  const logItemSplit = async (purchase, consumedQty, wastedQty) => {
    const userId = getCurrentUserId();
    if (!userId) {
      setSnackbar({ open: true, message: "You must be logged in to save.", severity: "error" });
      return false;
    }
    try {
      await consumptionAPI.logSplit({
        user_id: userId,
        purchase_id: purchase.id,
        consumed_quantity: Number(consumedQty.toFixed(4)),
        wasted_quantity: Number(wastedQty.toFixed(4)),
      });
      await refreshAfterLog();
      return true;
    } catch (e) {
      setSnackbar({
        open: true,
        message: e?.response?.data?.error || "Failed to log",
        severity: "error",
      });
      return false;
    }
  };

  const quickMarkRemaining = async (purchase, type) => {
    const breakdown = getPurchaseBreakdown(purchase, summaryMap[purchase.id] || {});
    if (breakdown.remaining <= 0) return;
    const consumedQty = type === "consumed" ? breakdown.remaining : 0;
    const wastedQty = type === "wasted" ? breakdown.remaining : 0;
    const ok = await logItemSplit(purchase, consumedQty, wastedQty);
    if (ok) {
      setSnackbar({
        open: true,
        message: type === "consumed" ? "Marked as eaten" : "Marked as wasted",
        severity: "success",
      });
    }
  };

  const buildEditableWeekList = () => {
    const editableWeeks = getEditableWeeks();
    const resolveWeek = (weekOf) =>
      weeklySummary.find((week) => week.weekOf === weekOf) || { weekOf, purchases: [] };

    return {
      editableWeeks,
      weeks: [resolveWeek(editableWeeks.currentWeek), resolveWeek(editableWeeks.previousWeek)],
    };
  };
  useEffect(() => {
    (async () => {
      const m = await fetchBatchSummaries();
      setSummaryMap(m);
    })();
  }, [purchasesFlat.length]);

  useEffect(() => {
    (async () => {
      const userId = getCurrentUserId();
      if (!userId || !weeklySummary.length) return;
      // Preload overall pie
      const overallRes = await consumptionAPI.getOverall({ user_id: userId });
      const o = overallRes.data || {};
      setOverallChart({
        labels: ["Consumed $", "Wasted $"],
        datasets: [
          {
            data: [parseFloat(o.consumed_cost || 0), parseFloat(o.wasted_cost || 0)],
            backgroundColor: ["#4caf50", "#ef5350"],
          },
        ],
      });
      setOverallTotals({
        consumed: parseFloat(o.consumed_cost || 0),
        wasted: parseFloat(o.wasted_cost || 0),
      });

      // Load category breakdown for all time
      const catRes = await consumptionAPI.getByCategory({ user_id: userId });
      setByCategory(catRes.data || []);
    })();
  }, [weeklySummary]);

  const loadTrend = async (period, offset = 0) => {
    const userId = getCurrentUserId();
    if (!userId) return;
    const count = period === 'day' ? 30 : period === 'week' ? 12 : 12;
    const trendRes = await consumptionAPI.getTrends({ user_id: userId, period, count, offset });
    const t = trendRes.data || [];
    
    // Filter out periods with no data (both consumed and wasted are 0)
    const filteredData = t.filter(x => {
      const consumed = parseFloat(x.consumed_qty || 0);
      const wasted = parseFloat(x.wasted_qty || 0);
      return consumed > 0 || wasted > 0;
    });
    
    const formatLabel = (date, periodType) => {
      const d = new Date(date);
      if (periodType === 'month') {
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      return d.toLocaleDateString();
    };
    
    setTrendData({
      labels: filteredData.map(x => formatLabel(x.bucket, period)),
      datasets: [
        {
          label: "% Wasted",
          data: filteredData.map(x => parseFloat((x.percent_wasted || 0).toFixed(2))),
          borderColor: "#ef5350",
          backgroundColor: "rgba(239,83,80,0.2)",
          tension: 0.3,
          fill: true,
        },
      ],
    });
  };

  useEffect(() => {
    if (overallOpen) {
      loadTrend(trendPeriod, trendOffset);
    }
  }, [overallOpen, trendPeriod, trendOffset]);

  const ensureWeekChart = async (weekOf, refresh = false) => {
    const userId = getCurrentUserId();
    if (!userId) return;
    if (!weekCharts[weekOf] || refresh) {
      const res = await consumptionAPI.getWeek({ user_id: userId, week_start: weekOf });
      const d = res.data || {};
      const consumed = parseFloat(d.consumed_cost || 0);
      const wasted = parseFloat(d.wasted_cost || 0);
      let unmarked = parseFloat(d.unmarked_cost);
      if (!isFinite(unmarked)) unmarked = 0;
      

      // Fallback: compute Unmarked $ from purchases list + summaries if backend doesn't provide it
      if (unmarked <= 0) {
        const weekGroup = weeklySummary.find(w => w.weekOf === weekOf);
        if (weekGroup) {
          let computed = 0;
          for (const p of weekGroup.purchases) {
            const baseQty = parseFloat(p.quantity || 0) || 0;
            const price = parseFloat(p.price || 0) || 0;
            const unitCost = baseQty > 0 && price ? price / baseQty : 0;
            const sums = summaryMap[p.id] || {};
            const cQty = parseFloat(sums.consumed_qty || 0) || 0;
            const wQty = parseFloat(sums.wasted_qty || 0) || 0;
            const remainingQty = Math.max(0, baseQty - cQty - wQty);
            computed += unitCost * remainingQty;
          }
          unmarked = computed;
        }
      }

      unmarked = Math.max(0, unmarked);
      setWeekCharts(prev => ({
        ...prev,
        [weekOf]: {
          labels: ["Consumed $", "Wasted $", "Unmarked $"],
          datasets: [
            { data: [consumed, wasted, unmarked], backgroundColor: ["#4caf50", "#ef5350", "#42a5f5"] },
          ],
        },
      }));
      setWeekChartTotals(prev => ({
        ...prev,
        [weekOf]: { consumed, wasted, unmarked },
      }));
    }
  };

  const openWeekDetails = async (weekOf) => {
    await ensureWeekChart(weekOf, true);
    setActiveWeekOf(weekOf);
  };

  const openLogDialog = (purchase) => {
    setSelectedPurchase(purchase);
    setLogWizard(INITIAL_LOG_WIZARD);
  };

  const closeDialog = () => {
    setSelectedPurchase(null);
    setLogWizard(INITIAL_LOG_WIZARD);
    setLogSaving(false);
    setResetConfirmOpen(false);
    setResetting(false);
  };

  const submitWizardLog = async (consumedAdd, wastedAdd) => {
    if (!selectedPurchase) return;
    setLogSaving(true);
    const ok = await logItemSplit(selectedPurchase, consumedAdd, wastedAdd);
    setLogSaving(false);
    if (ok) {
      closeDialog();
      setSnackbar({ open: true, message: "Saved", severity: "success" });
    }
  };

  const handlePickLogType = (type) => {
    setLogWizard({ step: 2, type, amount: 0 });
  };

  const handlePickPercent = (pct, remaining) => {
    const amount = amountFromPercent(remaining, pct);
    const { type } = logWizard;
    if (pct >= 1 || amount >= remaining - 0.0001) {
      if (type === "consumed") {
        submitWizardLog(remaining, 0);
      } else {
        submitWizardLog(0, remaining);
      }
      return;
    }
    setLogWizard((prev) => ({ ...prev, step: 3, amount }));
  };

  const handleMarkRestOpposite = (remaining) => {
    const rest = Math.max(0, remaining - logWizard.amount);
    if (logWizard.type === "consumed") {
      submitWizardLog(logWizard.amount, rest);
    } else {
      submitWizardLog(rest, logWizard.amount);
    }
  };

  const handleSaveRestForLater = () => {
    if (logWizard.type === "consumed") {
      submitWizardLog(logWizard.amount, 0);
    } else {
      submitWizardLog(0, logWizard.amount);
    }
  };

  const wizardBack = () => {
    setLogWizard((prev) => {
      if (prev.step === 3) return { ...prev, step: 2, amount: 0 };
      if (prev.step === 2) return INITIAL_LOG_WIZARD;
      return prev;
    });
  };

  const resetMarksForSelected = async () => {
    if (!selectedPurchase) return;
    const userId = getCurrentUserId();
    if (!userId) {
      setSnackbar({ open: true, message: "You must be logged in to reset.", severity: "error" });
      return;
    }
    try {
      setResetting(true);
      await consumptionAPI.resetPurchaseLogs({ user_id: userId, purchase_id: selectedPurchase.id });
      // Refresh summaries and keep dialog open so user can re-mark immediately.
      await fetchWeeklyPurchaseSummary();
      const m = await fetchBatchSummaries();
      setSummaryMap(m);
      if (activeWeekOf) {
        await ensureWeekChart(activeWeekOf, true);
      }
      setResetConfirmOpen(false);
      setSnackbar({ open: true, message: "Reset to unmarked.", severity: "success" });
      setLogWizard(INITIAL_LOG_WIZARD);
      window.dispatchEvent(new CustomEvent("taskCompleted"));
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.error || "Failed to reset.", severity: "error" });
    } finally {
      setResetting(false);
    }
  };

  const markWeekAsWasted = async (weekOf) => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError("You must be logged in to mark waste.");
      return;
    }
    try {
      const response = await consumptionAPI.autoWasteWeek({ user_id: userId, week_start: weekOf });
      
      if (response.data.inserted === 0) {
        setSnackbar({ open: true, message: 'No remaining food to mark as wasted for this week. All food has already been consumed or wasted.', severity: 'info' });
        return;
      }
      
      await fetchWeeklyPurchaseSummary();
      const m = await fetchBatchSummaries();
      setSummaryMap(m);
      await ensureWeekChart(weekOf, true);
      
      // Dispatch task completion event to update streak and task counts
      window.dispatchEvent(new CustomEvent('taskCompleted'));
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to mark week as wasted: ' + (error?.response?.data?.error || error.message), severity: 'error' });
    }
  };

  const markWeekAsConsumed = async (weekOf) => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError("You must be logged in to mark consumption.");
      return;
    }
    try {
      const response = await consumptionAPI.autoConsumeWeek({ user_id: userId, week_start: weekOf });
      
      if (response.data.inserted === 0) {
        setSnackbar({ open: true, message: 'No remaining food to mark as consumed for this week. All food has already been consumed or wasted.', severity: 'info' });
        return;
      }
      
      await fetchWeeklyPurchaseSummary();
      const m = await fetchBatchSummaries();
      setSummaryMap(m);
      await ensureWeekChart(weekOf, true);
      
      // Dispatch task completion event to update streak and task counts
      window.dispatchEvent(new CustomEvent('taskCompleted'));
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to mark week as consumed: ' + (error?.response?.data?.error || error.message), severity: 'error' });
    }
  };

  const pageTitle = activeWeekOf ? "Log consume & waste" : "Weekly Summary";

  const headerActions = activeWeekOf ? (
    <IconButton
      size="small"
      aria-label="Back to weekly summary"
      onClick={() => setActiveWeekOf(null)}
      sx={{
        backgroundColor: "rgba(0, 0, 0, 0.04)",
        "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.08)" },
      }}
    >
      <ArrowBackIosIcon fontSize="small" />
    </IconButton>
  ) : (
    <IconButton
      size="small"
      aria-label="Refresh summary"
      onClick={() => refreshAll(true)}
      disabled={loading}
      sx={{
        backgroundColor: "rgba(0, 0, 0, 0.04)",
        "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.08)" },
      }}
    >
      {loading ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
    </IconButton>
  );

  const weekDetailSubHeader = activeWeekOf ? (
    <Typography variant="caption" color="text.secondary" sx={{ display: "block", py: 0.75 }}>
      {formatWeekRange(activeWeekOf)}
    </Typography>
  ) : null;

  const { editableWeeks, weeks: editableWeekList } = buildEditableWeekList();

  return (
    <PageWrapper
      title={pageTitle}
      headerAction={headerActions}
      subHeader={weekDetailSubHeader}
    >
      {error && (
        <Paper elevation={0} sx={{ ...cardSx, p: 2, mb: 2, borderLeft: "4px solid", borderColor: "error.main" }}>
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        </Paper>
      )}

      {loading && weeklySummary.length === 0 ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading weekly summary…
          </Typography>
        </Box>
      ) : (
        <>
        {!activeWeekOf && (
          <Stack spacing={1.5}>
            <Paper elevation={0} sx={{ ...cardSx, p: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" gutterBottom>
                Your weekly food tracking
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
                Log purchases, then mark what you consumed or wasted for each week.
              </Typography>
              <SummaryLegend />
              <Button
                variant="outlined"
                fullWidth
                startIcon={<TrendingUpIcon />}
                onClick={() => setOverallOpen(true)}
                sx={{
                  mt: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1.1,
                }}
              >
                View all-time trends
              </Button>
            </Paper>

            <Typography
              variant="overline"
              sx={{
                display: "block",
                px: 0.5,
                color: "text.secondary",
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              Recent weeks
            </Typography>

            {editableWeekList.map((week) => {
              const stats = computeWeekStats(week, summaryMap);
              const isPastWeek = moment
                .tz(week.weekOf, "MM/DD/YYYY", "America/New_York")
                .isBefore(moment.tz("America/New_York").startOf("week"));
              const showCompletion = stats.isCompleted && isPastWeek;
              const weekLabel =
                week.weekOf === editableWeeks.currentWeek
                  ? "This week"
                  : week.weekOf === editableWeeks.previousWeek
                    ? "Last week"
                    : null;

              return (
                <Paper key={week.weekOf} elevation={0} sx={{ ...cardSx, p: 2 }}>
                  <Stack
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ mb: 1.5 }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      {weekLabel && (
                        <Chip
                          label={weekLabel}
                          size="small"
                          color={weekLabel === "This week" ? "primary" : "default"}
                          sx={{ mb: 0.75, fontWeight: 600, height: 24 }}
                        />
                      )}
                      <Typography variant="subtitle1" fontWeight={700} lineHeight={1.25}>
                        {formatWeekRange(week.weekOf)}
                      </Typography>
                      {!stats.isEmpty && (
                        <Typography variant="caption" color="text.secondary">
                          {formatMoney(stats.totalSpent)} purchased
                        </Typography>
                      )}
                    </Box>
                    {showCompletion && (
                      <Chip label="Complete" size="small" color="success" sx={{ fontWeight: 600 }} />
                    )}
                  </Stack>

                  {!stats.isEmpty && (
                    <Box sx={{ mb: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Items logged
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {stats.progress}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={stats.progress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "rgba(0, 0, 0, 0.08)",
                        }}
                      />
                    </Box>
                  )}

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      py: 1.25,
                      px: 0.5,
                      mb: 1.5,
                      borderRadius: 2,
                      backgroundColor: "rgba(0, 0, 0, 0.03)",
                    }}
                  >
                    <WeekStat
                      Icon={ShoppingCartIcon}
                      label="Purchased"
                      value={stats.isEmpty ? "0" : String(stats.itemCount)}
                      color="primary.main"
                    />
                    <WeekStat
                      Icon={RestaurantIcon}
                      label="Consumed"
                      value={
                        stats.consumedQty > 0 ? formatMoney(stats.consumedCost) : "—"
                      }
                      color="success.main"
                    />
                    <WeekStat
                      Icon={DeleteForeverIcon}
                      label="Wasted"
                      value={stats.wastedQty > 0 ? formatMoney(stats.wastedCost) : "—"}
                      color="error.main"
                    />
                  </Stack>

                  {stats.isEmpty ? (
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => goToLogForWeek(week.weekOf)}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        py: 1.1,
                      }}
                    >
                      {weekLabel === "Last week"
                        ? "Add food for last week"
                        : "Add food for this week"}
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      endIcon={<ChevronRightIcon />}
                      onClick={() => openWeekDetails(week.weekOf)}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        py: 1.1,
                      }}
                    >
                      Manage consume / waste
                    </Button>
                  )}
                </Paper>
              );
            })}

            <Paper
              elevation={0}
              sx={{
                ...cardSx,
                p: 2,
                opacity: 0.72,
                backgroundColor: "rgba(0, 0, 0, 0.02)",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Chip
                  label="Upcoming"
                  size="small"
                  icon={<CalendarTodayOutlinedIcon sx={{ fontSize: "14px !important" }} />}
                  sx={{ fontWeight: 600, height: 24 }}
                />
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                  {formatWeekRange(editableWeeks.nextWeek)}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
                You can start logging food for next week once it begins.
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  py: 1.25,
                  px: 0.5,
                  borderRadius: 2,
                  backgroundColor: "rgba(0, 0, 0, 0.03)",
                }}
              >
                <WeekStat Icon={ShoppingCartIcon} label="Purchased" value="0" color="text.disabled" />
                <WeekStat Icon={RestaurantIcon} label="Consumed" value="—" color="text.disabled" />
                <WeekStat Icon={DeleteForeverIcon} label="Wasted" value="—" color="text.disabled" />
              </Stack>
            </Paper>
          </Stack>
        )}

      {activeWeekOf && (() => {
        const week = weeklySummary.find((w) => w.weekOf === activeWeekOf);
        if (!week) return null;

        const editable = isWeekEditable(activeWeekOf);
        let totalConsumedCost = 0;
        let totalWastedCost = 0;
        let totalUnmarkedCost = 0;
        let totalRemaining = 0;

        week.purchases.forEach((purchase) => {
          const summary = summaryMap[purchase.id] || {};
          const breakdown = getPurchaseBreakdown(purchase, summary);
          totalConsumedCost += breakdown.consumedCost;
          totalWastedCost += breakdown.wastedCost;
          totalRemaining += breakdown.remaining;
          const price = parseFloat(purchase.price) || 0;
          const unitCost = breakdown.base > 0 ? price / breakdown.base : 0;
          totalUnmarkedCost += unitCost * breakdown.remaining;
        });

        const items = week.purchases
          .map((item) => ({
            item,
            breakdown: getPurchaseBreakdown(item, summaryMap[item.id] || {}),
          }))
          .sort((a, b) =>
            a.breakdown.completed === b.breakdown.completed
              ? 0
              : a.breakdown.completed
                ? 1
                : -1
          );

        const qtyLabel = (item, amount) => {
          const unit = item.quantity_type || "";
          return unit ? `${formatNum(amount)} ${unit}` : formatNum(amount);
        };

        return (
          <Stack spacing={1.5}>
            <Paper elevation={0} sx={{ ...cardSx, p: 2, mb: 1.5 }}>
              <SummaryLegend />
              <Box
                sx={{
                  display: "flex",
                  height: 10,
                  borderRadius: 5,
                  overflow: "hidden",
                  bgcolor: "rgba(0,0,0,0.08)",
                  mt: 1.5,
                  mb: 1.5,
                }}
              >
                {totalConsumedCost + totalWastedCost + totalUnmarkedCost > 0 ? (
                  <>
                    <Box
                      sx={{
                        width: `${(totalConsumedCost / (totalConsumedCost + totalWastedCost + totalUnmarkedCost)) * 100}%`,
                        bgcolor: "success.main",
                        minWidth: totalConsumedCost > 0 ? 4 : 0,
                      }}
                    />
                    <Box
                      sx={{
                        width: `${(totalWastedCost / (totalConsumedCost + totalWastedCost + totalUnmarkedCost)) * 100}%`,
                        bgcolor: "error.main",
                        minWidth: totalWastedCost > 0 ? 4 : 0,
                      }}
                    />
                    <Box sx={{ flex: 1, bgcolor: "primary.light", opacity: 0.55 }} />
                  </>
                ) : (
                  <Box sx={{ width: "100%", bgcolor: "primary.light", opacity: 0.35 }} />
                )}
              </Box>
              <Stack direction="row" spacing={1}>
                <WeekStat
                  Icon={RestaurantIcon}
                  label="Eaten"
                  value={formatMoney(totalConsumedCost)}
                  color="success.main"
                />
                <WeekStat
                  Icon={DeleteForeverIcon}
                  label="Wasted"
                  value={formatMoney(totalWastedCost)}
                  color="error.main"
                />
                <WeekStat
                  Icon={ShoppingCartIcon}
                  label="Unmarked"
                  value={formatMoney(totalUnmarkedCost)}
                  color="primary.main"
                />
              </Stack>
            </Paper>

            {editable && totalRemaining > 0.001 && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="flex-end"
                flexWrap="wrap"
                useFlexGap
                spacing={0.75}
                sx={{ mb: 1, px: 0.5, gap: 0.75 }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ mr: "auto" }}>
                  Mark all unmarked
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  color="success"
                  onClick={() => markWeekAsConsumed(activeWeekOf)}
                  sx={{ textTransform: "none", fontWeight: 600, minWidth: 0, px: 1 }}
                >
                  All eaten
                </Button>
                <Button
                  size="small"
                  variant="text"
                  color="error"
                  onClick={() => markWeekAsWasted(activeWeekOf)}
                  sx={{ textTransform: "none", fontWeight: 600, minWidth: 0, px: 1 }}
                >
                  All wasted
                </Button>
              </Stack>
            )}

            {!editable && (
              <Chip
                label="View only — this week can't be edited"
                size="small"
                sx={{ mb: 1.5, fontWeight: 600 }}
              />
            )}

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1, px: 0.5 }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                }}
              >
                {week.purchases.length === 0 ? "No food logged" : "Tap an item to log it"}
              </Typography>
              {editable && (
                <Button
                  size="small"
                  variant="text"
                  startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                  onClick={() => goToLogForWeek(activeWeekOf)}
                  sx={{ textTransform: "none", fontWeight: 600, flexShrink: 0 }}
                >
                  Add food
                </Button>
              )}
            </Stack>

            <Stack spacing={1.25}>
              {items.length === 0 ? (
                <Paper elevation={0} sx={{ ...cardSx, p: 3, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No purchases this week yet.
                  </Typography>
                  {editable && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => goToLogForWeek(activeWeekOf)}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                    >
                      Add food
                    </Button>
                  )}
                </Paper>
              ) : (
                items.map(({ item, breakdown }) => {
                  const hasPartial =
                    breakdown.consumed > 0.0001 || breakdown.wasted > 0.0001;
                  return (
                  <Paper key={item.id} elevation={0} sx={{ ...cardSx, p: 1.5 }}>
                    <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ mb: 1 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          flexShrink: 0,
                          bgcolor: "rgba(0,0,0,0.04)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.4rem",
                        }}
                      >
                        {getItemEmoji(item)}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ flex: 1 }}>
                            {item.name}
                          </Typography>
                          {breakdown.completed && (
                            <Chip label="Done" size="small" color="success" sx={{ height: 22, fontWeight: 600 }} />
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Purchased {qtyLabel(item, breakdown.base)}
                          {breakdown.remaining > 0.0001 &&
                            ` · ${qtyLabel(item, breakdown.remaining)} left`}
                        </Typography>
                      </Box>
                    </Stack>

                    <Box
                      sx={{
                        display: "flex",
                        height: 8,
                        borderRadius: 4,
                        overflow: "hidden",
                        bgcolor: "rgba(0,0,0,0.08)",
                        mb: 1.25,
                      }}
                    >
                      <Box sx={{ width: `${breakdown.pctConsumed}%`, bgcolor: "success.main" }} />
                      <Box sx={{ width: `${breakdown.pctWasted}%`, bgcolor: "error.main" }} />
                      <Box sx={{ flex: 1, bgcolor: "primary.light", opacity: 0.4 }} />
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ mb: editable ? 1.25 : 0 }}>
                      <Typography variant="caption" color="success.dark" fontWeight={600}>
                        Eaten {formatNum(breakdown.consumed)}
                      </Typography>
                      <Typography variant="caption" color="error.dark" fontWeight={600}>
                        Wasted {formatNum(breakdown.wasted)}
                      </Typography>
                    </Stack>

                    {editable && !breakdown.completed && (
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          color="success"
                          fullWidth
                          startIcon={<RestaurantIcon />}
                          onClick={() => quickMarkRemaining(item, "consumed")}
                          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, py: 1 }}
                        >
                          {hasPartial ? "Rest → eaten" : "All eaten"}
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          fullWidth
                          startIcon={<DeleteForeverIcon />}
                          onClick={() => quickMarkRemaining(item, "wasted")}
                          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, py: 1 }}
                        >
                          {hasPartial ? "Rest → wasted" : "All wasted"}
                        </Button>
                      </Stack>
                    )}

                    {editable && (
                      <Button
                        variant="text"
                        size="small"
                        fullWidth
                        onClick={() => openLogDialog(item)}
                        sx={{ mt: breakdown.completed ? 0 : 0.5, textTransform: "none", fontWeight: 600 }}
                      >
                        {breakdown.completed ? "Edit amounts" : "Log part of this"}
                      </Button>
                    )}
                  </Paper>
                  );
                })
              )}
            </Stack>
          </Stack>
        );
      })()}

      <Dialog
        open={!!selectedPurchase && isTabActive}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        sx={{
          zIndex: 1600,
          "& .MuiDialog-container": {
            alignItems: { xs: "flex-end", sm: "center" },
          },
          "& .MuiDialog-paper": {
            margin: { xs: 0, sm: 2 },
            width: "100%",
            maxWidth: 480,
            borderRadius: { xs: "20px 20px 0 0", sm: 3 },
            maxHeight: { xs: "90vh", sm: "90vh" },
          },
        }}
      >
        {selectedPurchase && (() => {
          const s = summaryMap[selectedPurchase.id] || {};
          const breakdown = getPurchaseBreakdown(selectedPurchase, s);
          const { base, consumed: consumedSoFar, wasted: wastedSoFar, remaining } = breakdown;
          const unit = selectedPurchase.quantity_type || "";
          const unitSuffix = unit ? ` ${unit}` : "";
          const qty = (n) => `${formatNum(n)}${unitSuffix}`;
          const isEaten = logWizard.type === "consumed";
          const oppositeLabel = isEaten ? "wasted" : "eaten";
          const restAfterPick = Math.max(0, remaining - logWizard.amount);
          const showWizard = remaining > 0;
          const wizardBtnSx = {
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            py: 1.25,
          };

          return (
            <>
              <DialogTitle sx={{ pb: 1 }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap>
                      {selectedPurchase.name}
                    </Typography>
                    {showWizard && (
                      <PartialLogWizardProgress currentStep={logWizard.step} />
                    )}
                  </Box>
                  <IconButton size="small" onClick={closeDialog} aria-label="Close" sx={{ mt: -0.5 }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </DialogTitle>
              <DialogContent sx={{ pt: 0 }}>
                <Stack spacing={1.75}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                      <strong>{qty(remaining)}</strong> left of {qty(base)}
                    </Typography>
                    <ItemProgressBar
                      base={base}
                      consumedSoFar={consumedSoFar}
                      wastedSoFar={wastedSoFar}
                    />
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                      <Typography variant="caption" color="success.dark" fontWeight={600}>
                        Eaten {qty(consumedSoFar)}
                      </Typography>
                      <Typography variant="caption" color="error.dark" fontWeight={600}>
                        Wasted {qty(wastedSoFar)}
                      </Typography>
                    </Stack>
                  </Box>

                  {!showWizard ? (
                    <Typography variant="body2" color="text.secondary">
                      Fully logged. Use Reset to change.
                    </Typography>
                  ) : logWizard.step === 1 ? (
                    <Stack spacing={1.25}>
                      <WizardStepTitle>Ate or wasted?</WizardStepTitle>
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        startIcon={<RestaurantIcon />}
                        onClick={() => handlePickLogType("consumed")}
                        disabled={logSaving}
                        sx={wizardBtnSx}
                      >
                        What I ate
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        startIcon={<DeleteForeverIcon />}
                        onClick={() => handlePickLogType("wasted")}
                        disabled={logSaving}
                        sx={wizardBtnSx}
                      >
                        What I wasted
                      </Button>
                    </Stack>
                  ) : logWizard.step === 2 ? (
                    <Stack spacing={1.25}>
                      <WizardStepTitle>
                        How much {isEaten ? "did you eat" : "did you waste"}?
                      </WizardStepTitle>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: 1,
                        }}
                      >
                        {LOG_PERCENT_OPTIONS.map(({ label, pct }) => {
                          const approx = amountFromPercent(remaining, pct);
                          return (
                            <Button
                              key={label}
                              variant="outlined"
                              onClick={() => handlePickPercent(pct, remaining)}
                              disabled={logSaving}
                              sx={{
                                ...wizardBtnSx,
                                flexDirection: "column",
                                py: 1.35,
                                borderColor: isEaten ? "success.light" : "error.light",
                                color: isEaten ? "success.dark" : "error.dark",
                              }}
                            >
                              {label}
                              <Typography component="span" variant="caption" sx={{ opacity: 0.8 }}>
                                {pct >= 1 ? qty(remaining) : `≈ ${qty(approx)}`}
                              </Typography>
                            </Button>
                          );
                        })}
                      </Box>
                    </Stack>
                  ) : (
                    <Stack spacing={1.25}>
                      <WizardStepTitle>
                        {qty(restAfterPick)} still unmarked
                      </WizardStepTitle>
                      <Button
                        variant="contained"
                        color={isEaten ? "error" : "success"}
                        fullWidth
                        onClick={() => handleMarkRestOpposite(remaining)}
                        disabled={logSaving}
                        sx={wizardBtnSx}
                      >
                        Mark rest as {oppositeLabel}
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleSaveRestForLater}
                        disabled={logSaving}
                        sx={wizardBtnSx}
                      >
                        Save for later
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </DialogContent>
              <DialogActions
                sx={{
                  px: 2,
                  pb: "calc(16px + env(safe-area-inset-bottom, 0px))",
                  justifyContent: "space-between",
                }}
              >
                <Button
                  color="error"
                  variant="text"
                  onClick={() => setResetConfirmOpen(true)}
                  disabled={consumedSoFar + wastedSoFar <= 0 || resetting || logSaving}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  Reset
                </Button>
                <Stack direction="row" spacing={1}>
                  {logWizard.step > 1 && remaining > 0 && (
                    <Button
                      onClick={wizardBack}
                      disabled={logSaving}
                      startIcon={<ArrowBackIosIcon sx={{ fontSize: 14 }} />}
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={closeDialog}
                    disabled={logSaving}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Cancel
                  </Button>
                </Stack>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* Confirm reset */}
      <AppConfirmDialog
        open={resetConfirmOpen}
        onClose={() => !resetting && setResetConfirmOpen(false)}
        zIndex={1700}
        tone="warning"
        icon={<RestartAltOutlinedIcon />}
        title="Reset this item?"
        primaryAction={{
          label: resetting ? "Resetting…" : "Reset",
          color: "error",
          onClick: resetMarksForSelected,
          disabled: resetting,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setResetConfirmOpen(false),
          disabled: resetting,
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
          This will delete all consumed/wasted marks for this item and make it fully unmarked
          again.
        </Typography>
      </AppConfirmDialog>

		{/* Overall trends dialog */}
		<Dialog open={overallOpen && isTabActive} onClose={() => setOverallOpen(false)} fullScreen>
			<Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
			<Box sx={{ 
				flexShrink: 0,
				backgroundColor: 'primary.main',
				color: 'white',
				px: { xs: 2, sm: 3 },
				pt: 'calc(12px + env(safe-area-inset-top, 0px))',
				pb: 2,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
			}}>
				<Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>All-time Trends</Typography>
				<IconButton 
					edge="end" 
					color="inherit" 
					onClick={() => setOverallOpen(false)} 
					aria-label="close"
					sx={{
						backgroundColor: 'rgba(255, 255, 255, 0.15)',
						'&:hover': {
							backgroundColor: 'rgba(255, 255, 255, 0.25)'
						}
					}}
				>
					<CloseIcon />
				</IconButton>
			</Box>
				<Tabs value={tabIndex} onChange={(_, v)=>setTabIndex(v)} variant="fullWidth" sx={{ flexShrink: 0 }}>
					<Tab label="Overall" />
					<Tab label="Trend" />
					<Tab label="Category" />
				</Tabs>
				<Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
					<SwipeableViews index={tabIndex} onChangeIndex={setTabIndex} style={{ height:'100%' }} containerStyle={{ height:'100%' }}>
						{/* Overall Pie */}
						<Box sx={{ height:'100%', overflow:'auto', p:2 }}>
							<Stack spacing={2}>
								{overallChart && (
									<Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
										<Box sx={{ maxWidth: 240, width: '100%' }}>
											<Typography variant="subtitle2" sx={{ textAlign: "center", mb: 1 }}>All-time: $ Consumed vs $ Wasted</Typography>
											<Pie data={overallChart} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } }} />
										</Box>
										{overallTotals && (
											<Stack spacing={0.25} sx={{ mt: 1, alignItems: 'center' }}>
												<Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
													<Box sx={{ width: 10, height: 10, bgcolor: '#4caf50', borderRadius: '50%' }} /> Consumed: {formatMoney(overallTotals.consumed)}
												</Typography>
												<Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
													<Box sx={{ width: 10, height: 10, bgcolor: '#ef5350', borderRadius: '50%' }} /> Wasted: {formatMoney(overallTotals.wasted)}
												</Typography>
											</Stack>
										)}
									</Box>
								)}
							</Stack>
						</Box>

						{/* Trend Line */}
						<Box sx={{ height:'100%', overflow:'auto', p:2 }}>
							<Stack spacing={2}>
								<ToggleButtonGroup
									value={trendPeriod}
									exclusive
									onChange={(_, v) => {
										if (v) {
											setTrendPeriod(v);
											setTrendOffset(0); // Reset offset when changing period
										}
									}}
									color="primary"
									size="small"
									sx={{ alignSelf: 'center' }}
								>
									<ToggleButton value="day">By Day</ToggleButton>
									<ToggleButton value="week">By Week</ToggleButton>
									<ToggleButton value="month">By Month</ToggleButton>
								</ToggleButtonGroup>
								
								{/* Time Navigation Controls */}
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
									<IconButton 
										size="small"
										onClick={() => {
											// Bigger increments based on period type
											const increment = trendPeriod === 'day' ? 7 : trendPeriod === 'week' ? 4 : 3;
											setTrendOffset(prev => prev + increment);
										}}
										sx={{ 
											border: '1px solid',
											borderColor: 'divider',
											'&:hover': { bgcolor: 'action.hover' }
										}}
									>
										<ArrowBackIosIcon fontSize="small" />
									</IconButton>
									<Typography variant="body2" sx={{ minWidth: 120, textAlign: 'center' }}>
										{trendOffset === 0 
											 ? 'Current Period' 
										 : `${trendOffset} ${trendPeriod}${trendOffset > 1 ? 's' : ''} ago`}
									</Typography>
									<IconButton 
										size="small"
										onClick={() => {
											// Bigger increments based on period type
											const increment = trendPeriod === 'day' ? 7 : trendPeriod === 'week' ? 4 : 3;
											setTrendOffset(prev => Math.max(0, prev - increment));
										}}
										disabled={trendOffset === 0}
										sx={{ 
											border: '1px solid',
											borderColor: 'divider',
											'&:hover': { bgcolor: 'action.hover' },
											'&:disabled': { opacity: 0.3 }
										}}
									>
										<ArrowForwardIosIcon fontSize="small" />
									</IconButton>
								</Box>
								
								{trendData && (
									<Box sx={{ maxWidth: 700, mx: "auto" }}>
										<Typography variant="subtitle2" sx={{ textAlign: "center", mb: 1 }}>
											Trend: % Wasted ({trendPeriod === 'day' ? 'Daily' : trendPeriod === 'week' ? 'Weekly' : 'Monthly'})
										</Typography>
										<Line data={trendData} options={{ scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + '%' } } } }} />
									</Box>
								)}
							</Stack>
						</Box>

                        {/* By Category */}
                        <Box sx={{ height:'100%', overflow:'auto', p:2 }}>
                            <Stack spacing={2}>
                                {(() => {
                                  const filtered = (byCategory || []).filter(r => parseFloat(r.wasted_cost || 0) > 0);
                                  if (filtered.length === 0) {
                                    return (
                                      <Typography variant="body2" sx={{ textAlign:'center', color:'text.secondary' }}>
                                        No category waste data yet.
                                      </Typography>
                                    );
                                  }
                                  const maxWaste = Math.max(...filtered.map(c => parseFloat(c.wasted_cost || 0)));
                                  return (
                                    <>
                                      <Box sx={{ maxWidth: 700, mx: "auto" }}>
                                        <Typography variant="subtitle2" sx={{ textAlign: "center", mb: 1 }}>Waste by Category (All time)</Typography>
                                        <List dense>
                                          {filtered.map((row) => (
                                            <ListItem key={row.category} sx={{ py: 0.5 }}>
                                              <ListItemText
                                                primary={
                                                  <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:1 }}>
                                                    <Typography variant="body2">{row.category}</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatMoney(row.wasted_cost || 0)}</Typography>
                                                  </Box>
                                                }
                                                secondary={
                                                  <Box sx={{ mt: 0.5, height: 6, backgroundColor:'grey.200', borderRadius: 3 }}>
                                                    <Box sx={{ width: `${maxWaste > 0 ? (parseFloat(row.wasted_cost || 0) / maxWaste) * 100 : 0}%`, height: '100%', backgroundColor: '#ef5350', borderRadius: 3 }} />
                                                  </Box>
                                                }
                />
              </ListItem>
            ))}
          </List>
                                      </Box>
                                      {/* Suggestions based on top wasted categories (all time) */}
                                      <Box sx={{ maxWidth: 700, mx: 'auto' }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1, textAlign:'center' }}>Suggestions to reduce waste</Typography>
                                        {(() => {
                                          const tips = [];
                                          const ranked = [...filtered]
                                            .sort((a,b) => (parseFloat(b.wasted_cost||0) - parseFloat(a.wasted_cost||0)))
                                            .slice(0, 2);
                                          const topSet = new Set(ranked.map(r => String(r.category || 'Uncategorized')));
                                          const addTip = (cat, text) => { if (topSet.has(cat)) tips.push({ cat, text }); };

                                          ranked.forEach(row => {
                                            const cat = String(row.category || 'Uncategorized');
                                            const totalCost = parseFloat(row.total_cost || 0);
                                            const wastedCost = parseFloat(row.wasted_cost || 0);
                                            const wastedPct = totalCost > 0 ? (wastedCost / totalCost) * 100 : 0;
                                            if (wastedPct >= 25) {
                                              addTip(cat, `~${wastedPct.toFixed(0)}% of your ${cat.toLowerCase()} spend is wasted. Buy smaller portions, plan servings precisely, or split bulk packs.`);
                                            } else if (wastedCost >= 10) {
                                              addTip(cat, `You’ve wasted about ${formatMoney(wastedCost)} on ${cat.toLowerCase()}. Front‑load recipes to use these within 2–3 days.`);
                                            } else {
                                              addTip(cat, `Some ${cat.toLowerCase()} are still going unused. Try a “use‑it‑first” bin in the fridge for soon‑to‑expire items.`);
                                            }
                                          });

                                          const catTips = {
                                            Bakery: 'Slice and freeze bread; toast from frozen. Keep in breathable bags to slow mold.',
                                            Vegetables: 'Store leafy greens with paper towels in airtight containers; roast extra veg mid‑week.',
                                            Fruits: 'Separate ethylene producers (bananas, apples) from berries; freeze ripe fruit for smoothies.',
                                            Dairy: 'Buy smaller milk/yogurt sizes; use near‑expiring dairy in sauces or bakes.',
                                            Meat: 'Portion and freeze on purchase day; defrost only what you will cook.',
                                            Seafood: 'Plan seafood for the day of purchase; freeze extras immediately.',
                                            Grains: 'Cook grains in batches and freeze portions; repurpose leftovers into bowls or salads.',
                                          };
                                          ranked.forEach(row => {
                                            const cat = String(row.category || 'Uncategorized');
                                            if (catTips[cat]) addTip(cat, catTips[cat]);
                                          });

                                          if (tips.length === 0) {
                                            return (
                                              <Typography variant="body2" sx={{ color:'text.secondary', textAlign:'center' }}>
                                                No suggestions yet. Log more items to personalize tips.
                                              </Typography>
                                            );
                                          }
                                          return (
                                            <List dense>
                                              {tips.map((t, i) => (
                                                <ListItem key={`${t.cat}-${i}`} sx={{ py: 0.5 }}>
                                                  <ListItemText
                                                    primary={<Typography variant="body2"><strong>{t.cat}:</strong> {t.text}</Typography>}
                                                  />
                                                </ListItem>
                                              ))}
                                            </List>
                                          );
                                        })()}
                                      </Box>
                                    </>
                                  );
                                })()}
                            </Stack>
                        </Box>
					</SwipeableViews>
				</Box>
			</Box>
		</Dialog>
        </>
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageWrapper>
  );
}

export default ConsumeWaste;
