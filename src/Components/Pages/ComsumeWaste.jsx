import React, { useEffect, useMemo, useState } from "react";
import { foodPurchaseAPI, consumptionAPI } from "../../api";
import moment from "moment-timezone";
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
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Container,
  Snackbar,
  Alert,
} from "@mui/material";
import PageWrapper from "../PageWrapper";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "../../utils/authUtils";
import SwipeableViews from 'react-swipeable-views';
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
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

function ConsumeWaste({ onGoToDate }) {
  const navigate = useNavigate();
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  // Two explicit sliders is clearer than a 2-thumb "boundary" slider:
  // users directly set how much they consumed vs wasted right now.
  const [consumedNow, setConsumedNow] = useState(0);
  const [wastedNow, setWastedNow] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const getStepForRemaining = (remaining) => {
    const r = Number(remaining) || 0;
    if (r <= 0) return 0.1;
    if (r <= 1) return 0.01;
    if (r <= 5) return 0.05;
    if (r <= 20) return 0.1;
    return 0.25;
  };

  const fetchWeeklyPurchaseSummary = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError("You must be logged in to view this data.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = { user_id: userId };
      const response = await foodPurchaseAPI.getWeeklySummary(params);
      setWeeklySummary(response.data || []);
    } catch (err) {
      console.error("Error fetching weekly summary:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyPurchaseSummary();
  }, []);

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

  const [summaryMap, setSummaryMap] = useState({});
  const [weekCharts, setWeekCharts] = useState({}); // { [weekOf]: chartData }
  const [weekChartTotals, setWeekChartTotals] = useState({}); // { [weekOf]: { consumed, wasted, unmarked } }
  const [trendData, setTrendData] = useState(null);
  const [overallChart, setOverallChart] = useState(null);
  const [overallTotals, setOverallTotals] = useState(null); // { consumed, wasted }
  const [overallOpen, setOverallOpen] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState('day'); // 'day' | 'week' | 'month'
  const [trendOffset, setTrendOffset] = useState(0); // Offset in periods to go back in time
  const [tabIndex, setTabIndex] = useState(0); // 0: overall pie, 1: trend, 2: by category
  const [activeWeekOf, setActiveWeekOf] = useState(null);
  const [byCategory, setByCategory] = useState([]);

  // Show exactly 2 editable weeks (previous week + current week) plus next week (disabled), with 7-day edit limit
  const getEditableWeeks = () => {
    const currentWeek = moment.tz('America/New_York').startOf('week');
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

  // Per-item action menu
  const [itemMenuAnchor, setItemMenuAnchor] = useState(null);
  const [itemMenuTarget, setItemMenuTarget] = useState(null);
  const openItemMenu = Boolean(itemMenuAnchor);
  const handleItemMenuOpen = (e, item) => { setItemMenuAnchor(e.currentTarget); setItemMenuTarget(item); };
  const handleItemMenuClose = () => { setItemMenuAnchor(null); setItemMenuTarget(null); };

  const formatNum = (n) => {
    const v = parseFloat(n || 0);
    if (Number.isNaN(v)) return "0.00";
    const rounded = Math.round(v * 100) / 100;
    return rounded.toFixed(2);
  };

  const formatMoney = (n) => `$${formatNum(n)}`;

  const Legend = () => (
    <Box
      sx={{
        position: 'sticky',
        top: { xs: '-48px', sm: '-52px' }, // Negative top to account for header height
        zIndex: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        borderBottom: '0.5px solid rgba(0, 0, 0, 0.06)',
        py: 0.5,
        px: { xs: 2, sm: 2.5 },
        mb: 1,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ color: "black" }}>
        <Box display="inline-flex" alignItems="center" gap={0.25}>
          <ShoppingCartIcon sx={{ color: 'primary.main', fontSize: 14 }} />
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Purchased</Typography>
        </Box>
        <Box display="inline-flex" alignItems="center" gap={0.25}>
          <RestaurantIcon sx={{ color: 'success.main', fontSize: 14 }} />
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Consumed</Typography>
        </Box>
        <Box display="inline-flex" alignItems="center" gap={0.25}>
          <DeleteForeverIcon sx={{ color: 'error.main', fontSize: 14 }} />
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Wasted</Typography>
        </Box>
      </Stack>
    </Box>
  );
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
    setConsumedNow(0);
    setWastedNow(0);
  };

  const closeDialog = () => {
    setSelectedPurchase(null);
    setResetConfirmOpen(false);
    setResetting(false);
  };

  const submitLog = async () => {
    if (!selectedPurchase) return;
    const userId = getCurrentUserId();
    if (!userId) {
      setSnackbar({ open: true, message: "You must be logged in to save.", severity: "error" });
      return;
    }
    const s = summaryMap[selectedPurchase.id] || {};
    const baseQty = parseFloat(selectedPurchase.quantity) || 0;
    const already =
      (parseFloat(s.consumed_qty || 0) || 0) +
      (parseFloat(s.wasted_qty || 0) || 0);
    const remaining = Math.max(0, baseQty - already);
    const consumed = Math.min(Math.max(parseFloat(consumedNow || 0) || 0, 0), remaining);
    const wasted = Math.min(
      Math.max(parseFloat(wastedNow || 0) || 0, 0),
      Math.max(0, remaining - consumed)
    );
    const consumedQty = Number(consumed.toFixed(4));
    const wastedQty = Number(wasted.toFixed(4));
    if (consumedQty <= 0 && wastedQty <= 0) return;

    try {
      await consumptionAPI.logSplit({
        user_id: userId,
        purchase_id: selectedPurchase.id,
        consumed_quantity: consumedQty,
        wasted_quantity: wastedQty,
      });
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.error || "Failed to log", severity: 'error' });
      return;
    }
    closeDialog();
    await fetchWeeklyPurchaseSummary();
    const m = await fetchBatchSummaries();
    setSummaryMap(m);
    if (activeWeekOf) {
      await ensureWeekChart(activeWeekOf, true);
    }
    
    // Dispatch task completion event to update streak and task counts
    window.dispatchEvent(new CustomEvent('taskCompleted'));
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
      setConsumedNow(0);
      setWastedNow(0);
      setResetConfirmOpen(false);
      setSnackbar({ open: true, message: "Reset to unmarked.", severity: "success" });
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

  const pageTitle = activeWeekOf ? formatWeekRange(activeWeekOf) : 'Weekly Summary';

  if (loading)
    return (
      <PageWrapper title={pageTitle} maxWidth="sm">
        <Container maxWidth="sm" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" mt={2} fontStyle="italic">
            Loading weekly purchase summary...
          </Typography>
        </Container>
      </PageWrapper>
    );

  if (error)
    return (
      <PageWrapper title={pageTitle} maxWidth="sm">
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Typography color="error" textAlign="center">
            {error}
          </Typography>
        </Container>
      </PageWrapper>
    );

  const trendsButton = !activeWeekOf ? (
    <Button 
      variant="outlined" 
      size="small"
      startIcon={<TrendingUpIcon />}
      onClick={() => setOverallOpen(true)}
      sx={{
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 500,
        fontSize: { xs: '0.75rem', sm: '0.875rem' },
        py: 0.5,
        px: 1.5
      }}
    >
      View Trends
    </Button>
  ) : null;

  return (
    <PageWrapper title={pageTitle} maxWidth="sm" headerAction={trendsButton}>
      <Container 
        maxWidth="sm"
        sx={{ 
          maxWidth: { xs: '100%', sm: '600px' },
          px: { xs: 2, sm: 2.5 },
          py: { xs: 2.5, sm: 3 },
          pb: 0 // PageWrapper handles bottom padding for nav bar
        }}
      >

        {!activeWeekOf && <Legend />}

        {!activeWeekOf && (
          <Box>
          {/* Editable Weeks Section */}
          <Box sx={{ backgroundColor: 'grey.50', borderRadius: 2, p: 1, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
              Recent Weeks (Editable)
            </Typography>
            {(() => {
              const editableWeeks = getEditableWeeks();
              
              // Show both previous week and current week (editable)
              const allWeeks = [];
              
              // Add previous week (with data if available, or placeholder)
              const previousWeekData = weeklySummary.find(week => week.weekOf === editableWeeks.previousWeek);
              if (previousWeekData) {
                allWeeks.push(previousWeekData);
              } else {
                allWeeks.push({
                  weekOf: editableWeeks.previousWeek,
                  purchases: []
                });
              }
              
              // Add current week (with data if available, or placeholder)
              const currentWeekData = weeklySummary.find(week => week.weekOf === editableWeeks.currentWeek);
              if (currentWeekData) {
                allWeeks.push(currentWeekData);
              } else {
                allWeeks.push({
                  weekOf: editableWeeks.currentWeek,
                  purchases: []
                });
              }
              
              return allWeeks;
            })().map((week) => {
            // Calculate completion status for this week
            const ids = week.purchases.map(p => p.id);
            let totalItems = 0;
            let completedItems = 0;
            let totalQuantity = 0;
            let completedQuantity = 0;
            
            ids.forEach(id => {
              const s = summaryMap[id] || {};
              const purchase = week.purchases.find(p => p.id === id);
              if (purchase) {
                const baseQty = parseFloat(purchase.quantity) || 0;
                const consumedQty = parseFloat(s.consumed_qty || 0);
                const wastedQty = parseFloat(s.wasted_qty || 0);
                const totalLogged = consumedQty + wastedQty;
                
                totalItems++;
                totalQuantity += baseQty;
                completedQuantity += totalLogged;
                
                if (totalLogged >= baseQty - 0.0001) { // Account for floating point precision
                  completedItems++;
                }
              }
            });
            
            const isCompleted = totalItems > 0 && completedItems === totalItems;
            const isPastWeek = moment.tz(week.weekOf, 'MM/DD/YYYY', 'America/New_York').isBefore(moment.tz('America/New_York').startOf('week'));
            const showCompletion = isCompleted && isPastWeek;
            
            // Handle empty weeks
            const isEmpty = week.purchases.length === 0;
            
            return (
        <Paper
          key={week.weekOf}
          elevation={0}
          sx={{
            mb: 2,
            p: { xs: 1.75, sm: 2.25 },
            borderRadius: 2.5,
            width: "100%", // Use percentage instead of viewport units
            maxWidth: "100%", // Ensure it doesn't overflow
            cursor: 'pointer',
            border: 1,
            borderColor: showCompletion ? "success.main" : "divider",
            position: 'relative',
            boxSizing:"border-box",
            backgroundColor: 'background.paper',
            boxShadow: '0px 2px 10px rgba(0,0,0,0.06)',
            transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0px 8px 20px rgba(0,0,0,0.10)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              right: 0,
              height: 4,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              backgroundColor: showCompletion
                ? 'success.main'
                : (isEmpty ? 'grey.400' : 'primary.main'),
              opacity: 0.9,
            },
          }}
          onClick={() => {
            if (isEmpty) {
              // If week is empty, navigate to log page to add food
              const weekStart = moment.tz(week.weekOf, 'MM/DD/YYYY', 'America/New_York');
              // Format date as YYYY-MM-DD for URL parameter
              const dateParam = weekStart.format('YYYY-MM-DD');
              navigate(`/log?date=${dateParam}`);
            } else {
              // If week has purchases, open week details to manage waste/consumption
              openWeekDetails(week.weekOf);
            }
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25, pt: 0.5 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-0.2px',
                color: 'text.primary',
              }}
            >
              {formatWeekRange(week.weekOf)}
            </Typography>
            {showCompletion && (
              <Chip
                label="Complete"
                size="small"
                color="success"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Stack>
          
          {/* Clear tap instruction */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 1,
            p: 1,
            backgroundColor: isEmpty ? 'grey.50' : 'primary.50',
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: isEmpty ? 'grey.200' : 'primary.200'
          }}>
            <Typography variant="body2" sx={{ color: isEmpty ? 'text.secondary' : 'primary.main', fontWeight: 650 }}>
              {isEmpty ? 'Tap to add food' : 'Tap to manage consume / waste'}
            </Typography>
          </Box>
          {/* Stats */}
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 0.25 }}>
            <Chip
              size="small"
              icon={<ShoppingCartIcon sx={{ fontSize: 18 }} />}
              label={`${week.purchases.length} ${week.purchases.length === 1 ? 'item' : 'items'}`}
              variant="outlined"
              sx={{ fontWeight: 650 }}
            />

            {isEmpty ? (
              <Chip
                size="small"
                icon={<FastfoodIcon sx={{ fontSize: 18 }} />}
                label="No food yet"
                variant="outlined"
                sx={{ color: 'text.secondary' }}
              />
            ) : (() => {
              const ids = week.purchases.map(p => p.id);
              let c = 0, w = 0, cc = 0, wc = 0, unloggedCost = 0;
              
              ids.forEach(id => {
                const s = summaryMap[id] || {};
                const purchase = week.purchases.find(p => p.id === id);
                if (purchase) {
                  c += parseFloat(s.consumed_qty || 0);
                  w += parseFloat(s.wasted_qty || 0);
                  cc += parseFloat(s.consumed_cost || 0);
                  wc += parseFloat(s.wasted_cost || 0);
                  
                  // Calculate unlogged cost for this item
                  const baseQty = parseFloat(purchase.quantity || 0);
                  const price = parseFloat(purchase.price || 0);
                  const unitCost = baseQty > 0 && price ? price / baseQty : 0;
                  const consumedQty = parseFloat(s.consumed_qty || 0);
                  const wastedQty = parseFloat(s.wasted_qty || 0);
                  const remainingQty = Math.max(0, baseQty - consumedQty - wastedQty);
                  unloggedCost += unitCost * remainingQty;
                }
              });
              
              const hasConsumptionData = c > 0 || w > 0;
              
              if (hasConsumptionData) {
                return (
                  <>
                    <Chip
                      size="small"
                      icon={<RestaurantIcon sx={{ fontSize: 18 }} />}
                      label={`${formatNum(c)} (${formatMoney(cc)})`}
                      sx={{ bgcolor: 'success.50', color: 'success.dark', fontWeight: 700 }}
                    />
                    <Chip
                      size="small"
                      icon={<DeleteForeverIcon sx={{ fontSize: 18 }} />}
                      label={`${formatNum(w)} (${formatMoney(wc)})`}
                      sx={{ bgcolor: 'error.50', color: 'error.dark', fontWeight: 700 }}
                    />
                  </>
                );
              }
              
              return (
                <Chip
                  size="small"
                  icon={<FastfoodIcon sx={{ fontSize: 18 }} />}
                  label={`Unmarked ${formatMoney(unloggedCost)}`}
                  sx={{ bgcolor: 'warning.50', color: 'warning.dark', fontWeight: 700 }}
                />
              );
            })()}
          </Stack>
        </Paper>
        );
        })}
        
        {/* Next Week Card */}
        {(() => {
          const editableWeeks = getEditableWeeks();
          const nextWeekFormatted = editableWeeks.nextWeek;
          
          return (
            <Paper
              elevation={1}
              sx={{
                mb: 2,
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                width: "100%",
                maxWidth: "100%",
                border: 1,
                borderColor: "grey.300",
                position: 'relative',
                boxSizing: "border-box",
                opacity: 0.6,
                backgroundColor: 'grey.100'
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="text.secondary"
                    gutterBottom
                    sx={{ borderBottom: 2, borderColor: "grey.400", pb: 0.5 }}
                  >
                    {formatWeekRange(nextWeekFormatted)}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    backgroundColor: 'grey.400',
                    color: 'white',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    whiteSpace: "nowrap",
                    position: "absolute", 
                    top: "-10px"
                  }}>
                    Upcoming
                  </Box>
                </Box>
              </Stack>
              
              {/* Greyed out instruction */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 1,
                p: 1,
                backgroundColor: 'grey.200',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.300'
              }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  📅 Next week - Add food to get started
                </Typography>
              </Box>
              
              {/* Greyed out summary */}
              <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={2}>
                <Box component="span" display="inline-flex" alignItems="center" gap={0.5}>
                  <ShoppingCartIcon sx={{ color: 'grey.400', fontSize: 18 }} />
                  0 items
                </Box>
                <Box component="span" display="inline-flex" alignItems="center" gap={0.5}>
                  <RestaurantIcon sx={{ color: 'grey.400', fontSize: 18 }} />
                  0 consumed
                </Box>
                <Box component="span" display="inline-flex" alignItems="center" gap={0.5}>
                  <DeleteForeverIcon sx={{ color: 'grey.400', fontSize: 18 }} />
                  0 wasted
                </Box>
              </Typography>
            </Paper>
          );
        })()}
        </Box>
        
        </Box>
      )}

      {activeWeekOf && (() => {
        const week = weeklySummary.find(w => w.weekOf === activeWeekOf);
        if (!week) return null;
        return (
          <Box sx={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'white',
            zIndex: 1000,
            overflow: 'auto',
            borderRadius: 0,
            p: 2
          }}>
            <Legend />
            {weekCharts[activeWeekOf] && (() => {
              // Calculate pie chart data directly from summaryMap to ensure consistency
              let consumedCost = 0, wastedCost = 0, unmarkedCost = 0;
              
              week.purchases.forEach(purchase => {
                const summary = summaryMap[purchase.id] || {};
                consumedCost += parseFloat(summary.consumed_cost || 0);
                wastedCost += parseFloat(summary.wasted_cost || 0);
                
                // Calculate unmarked cost
                const baseQty = parseFloat(purchase.quantity || 0);
                const price = parseFloat(purchase.price || 0);
                const unitCost = baseQty > 0 && price ? price / baseQty : 0;
                const consumedQty = parseFloat(summary.consumed_qty || 0);
                const wastedQty = parseFloat(summary.wasted_qty || 0);
                const remainingQty = Math.max(0, baseQty - consumedQty - wastedQty);
                unmarkedCost += unitCost * remainingQty;
              });
              
              const total = consumedCost + wastedCost + unmarkedCost;
              
              // Check if there are any food items with consumption or waste data
              const hasConsumptionData = week.purchases.some(purchase => {
                const summary = summaryMap[purchase.id] || {};
                const consumedQty = parseFloat(summary.consumed_qty || 0);
                const wastedQty = parseFloat(summary.wasted_qty || 0);
                return consumedQty > 0 || wastedQty > 0;
              });
              
              if (total > 0.0001 || hasConsumptionData) {
                return (
                  <Box sx={{ maxWidth: 150, mx: "auto", mb: 1, color:"black", pt: 1, paddingTop: "20px" }}>
                    <Pie data={{
                      labels: ["Consumed $", "Wasted $", "Unmarked $"],
                      datasets: [{
                        data: [consumedCost, wastedCost, unmarkedCost],
                        backgroundColor: ["#4caf50", "#ef5350", "#42a5f5"]
                      }]
                    }} options={{ 
                      responsive: true, 
                      maintainAspectRatio: true, 
                      plugins: { legend: { display: false } },
                      aspectRatio: 1.1
                    }} />
                    <Stack direction="row" spacing={1.5} sx={{ mt: 1, justifyContent: 'center' }}>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem' }}>
                        <Box sx={{ width: 8, height: 8, bgcolor: '#4caf50', borderRadius: '50%' }} /> {formatMoney(consumedCost)}
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem' }}>
                        <Box sx={{ width: 8, height: 8, bgcolor: '#ef5350', borderRadius: '50%' }} /> {formatMoney(wastedCost)}
                      </Typography>
                    </Stack>
                  </Box>
                );
              }
              return (
                <Box sx={{ maxWidth: 220, mx: "auto", mb: 2 }}>
                  <Typography variant="body2" sx={{ textAlign: "center", color: 'text.secondary' }}>
                    No consumption or waste logged for this week yet.
                  </Typography>
                </Box>
              );
            })()}
            {/* Bulk Actions for the week */}
            {(() => {
              const currentWeek = weeklySummary.find(w => w.weekOf === activeWeekOf);
              const editableWeeks = getEditableWeeks();
              const isWeekEditable = currentWeek ? 
                (currentWeek.weekOf === editableWeeks.previousWeek || currentWeek.weekOf === editableWeeks.currentWeek) : 
                false;
              
              // Calculate total remaining portions for this week
              let totalRemaining = 0;
              if (currentWeek) {
                currentWeek.purchases.forEach(purchase => {
                  const summary = summaryMap[purchase.id] || {};
                  const baseQty = parseFloat(purchase.quantity || 0);
                  const consumedQty = parseFloat(summary.consumed_qty || 0);
                  const wastedQty = parseFloat(summary.wasted_qty || 0);
                  const remaining = Math.max(0, baseQty - consumedQty - wastedQty);
                  totalRemaining += remaining;
                });
              }
              
              const hasRemainingPortions = totalRemaining > 0.001; // Account for floating point precision
              
              return (
                <Box sx={{ mb: 1, p: 1.5, backgroundColor: isWeekEditable ? 'grey.100' : 'grey.200', borderRadius: 1.5 }}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.85rem' }}>
                    Quick Actions for {activeWeekOf}
                  </Typography>
                  {!isWeekEditable && (
                    <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', fontStyle: 'italic', fontSize: '0.7rem' }}>
                      This week is read-only (not in the last 2 weeks)
                    </Typography>
                  )}
                  {!hasRemainingPortions && isWeekEditable && (
                    <Typography variant="caption" sx={{ mb: 1, color: 'text.secondary', fontStyle: 'italic', fontSize: '0.7rem' }}>
                      All food items have been fully consumed or wasted
                    </Typography>
                  )}
                  {hasRemainingPortions && (
                    <Stack direction="row" spacing={0.5} sx={{ mb: 0.5 }}>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={() => markWeekAsConsumed(activeWeekOf)}
                        disabled={!isWeekEditable}
                        sx={{ flex: 1, fontSize: '0.7rem', py: 0.5 }}
                      >
                        Mark remaining as consumed
                      </Button>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={() => markWeekAsWasted(activeWeekOf)}
                        disabled={!isWeekEditable}
                        sx={{ flex: 1, fontSize: '0.7rem', py: 0.5 }}
                      >
                        Mark remaining as wasted
                      </Button>
                    </Stack>
                  )}
                  <Button 
                    variant="contained" 
                    size="small" 
                    onClick={() => { 
                      if(onGoToDate) {
                        // Navigate to the first day within the week that's still within 7 days
                        const weekStart = moment.tz(activeWeekOf, 'MM/DD/YYYY', 'America/New_York');
                        const weekEnd = weekStart.clone().add(6, 'days');
                        const today = moment.tz('America/New_York');
                        const sevenDaysAgo = today.clone().subtract(7, 'days');
                        
                        // Find the first day in the week range that's still within 7 days
                        let targetDate = weekStart;
                        for (let i = 0; i < 7; i++) {
                          const dayInWeek = weekStart.clone().add(i, 'days');
                          if (dayInWeek.isSameOrAfter(sevenDaysAgo) && dayInWeek.isSameOrBefore(today)) {
                            targetDate = dayInWeek;
                            break;
                          }
                        }
                        
                        // If no day in the week is within 7 days, use the last day of the week
                        if (!targetDate.isSameOrAfter(sevenDaysAgo)) {
                          targetDate = weekEnd;
                        }
                        
                        onGoToDate(targetDate.format('MM/DD/YYYY'));
                      }
                    }}
                    sx={{ width: '100%', fontSize: '0.8rem', py: 0.5 }}
                  >
                    Add more food
                  </Button>
                </Box>
              );
            })()}

            <Box sx={{ maxHeight: '50vh', overflow: 'auto', backgroundColor: 'grey.50', borderRadius: 2, p: 1 }}>
          <List disablePadding>
                {(() => {
                  const items = week.purchases
                    .map((it) => {
                      const s = summaryMap[it.id] || {};
                      const base = parseFloat(it.quantity) || 0;
                      const used = (parseFloat(s.consumed_qty || 0) + parseFloat(s.wasted_qty || 0)) || 0;
                      const remaining = Math.max(0, base - used);
                      const completed = remaining <= 0.0001;
                      return { it, s, remaining, completed };
                    })
                    .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
                  return items.map(({ it: item, s, completed, remaining }) => {
                    const rawC = parseFloat(s.consumed_qty || 0);
                    const rawW = parseFloat(s.wasted_qty || 0);
                    const base = parseFloat(item.quantity) || 0;
                    const cQty = formatNum(rawC);
                    const wQty = formatNum(rawW);
                    const cCost = formatMoney(s.consumed_cost || 0);
                    const wCost = formatMoney(s.wasted_cost || 0);
                    const pctC = base > 0 ? (rawC / base) * 100 : 0;
                    const pctW = base > 0 ? (rawW / base) * 100 : 0;
                    return (
              <ListItem
                key={item.id}
                sx={{
                          bgcolor: completed ? 'action.hover' : 'background.default',
                  mb: 1,
                  borderRadius: 1,
                  boxShadow: 1,
                          opacity: completed ? 0.8 : 1,
                          color: 'text.primary',
                }}
              >
                <ListItemText
                  primary={
                    <Typography fontWeight={600} display="flex" alignItems="center" gap={1} color="text.primary">
                              <span style={{ fontSize: 18 }}>{item.emoji || (item.category ? ({
                                Fruits: '🍎', Vegetables: '🥦', Bakery: '🍞', Dairy: '🥛', Meat: '🥩', Seafood: '🐟', Grains: '🌾',
                                'Canned Goods': '🥫', Frozen: '🧊', Beverages: '🥤', Juice: '🧃', Snacks: '🍿', Condiments: '🧂', Spices: '🧂',
                                Pantry: '📦', Deli: '🥪', 'Prepared Foods': '🍱', Breakfast: '🍳', Sauces: '🍝', Baking: '🧁', 'Oils & Vinegars': '🫒', Household: '🏠'
                              }[item.category] || '🍽️') : '🍽️')}</span>
                      {item.name}
                    </Typography>
                  }
                          secondary={
                            completed ? (
                              <Box>
                                <Box sx={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', bgcolor: 'grey.300' }}>
                                  <Box sx={{ width: `${pctC}%`, bgcolor: 'success.main' }} />
                                  <Box sx={{ width: `${pctW}%`, bgcolor: 'error.main' }} />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">{cQty} ({cCost})</Typography>
                                  <Typography variant="caption" color="text.secondary">{wQty} ({wCost})</Typography>
                                </Box>
                              </Box>
                            ) : (
                              <Stack direction="row" spacing={2} alignItems="center" sx={{ color: 'text.primary' }}>
                                <Box display="inline-flex" alignItems="center" gap={0.5}>
                                  <ShoppingCartIcon sx={{ color: 'primary.main', fontSize: 16 }} />
                                  <Typography variant="caption" color="text.primary">{formatNum(item.quantity)}</Typography>
                                </Box>
                                <Box display="inline-flex" alignItems="center" gap={0.5}>
                                  <RestaurantIcon sx={{ color: 'success.main', fontSize: 16 }} />
                                  <Typography variant="caption" color="text.primary">{cQty} ({cCost})</Typography>
                                </Box>
                                <Box display="inline-flex" alignItems="center" gap={0.5}>
                                  <DeleteForeverIcon sx={{ color: 'error.main', fontSize: 16 }} />
                                  <Typography variant="caption" color="text.primary">{wQty} ({wCost})</Typography>
                                </Box>
                              </Stack>
                            )
                          }
                        />
                        <IconButton size="small" onClick={(e)=> handleItemMenuOpen(e, item)}>
                          <MoreVertIcon />
                        </IconButton>
                      </ListItem>
                    );
                  });
                })()}
              </List>
            </Box>
            <Menu anchorEl={itemMenuAnchor} open={openItemMenu} onClose={handleItemMenuClose}>
              {(() => {
                // Check if the current week is editable
                const currentWeek = weeklySummary.find(w => w.weekOf === activeWeekOf);
                const editableWeeks = getEditableWeeks();
                const isWeekEditable = currentWeek ? 
                  (currentWeek.weekOf === editableWeeks.previousWeek || currentWeek.weekOf === editableWeeks.currentWeek) : 
                  false;
                
                if (!isWeekEditable) {
                  return (
                    <MenuItem disabled>
                      <Typography variant="body2" color="text.secondary">
                        Cannot edit items not in the last 2 weeks
                      </Typography>
                    </MenuItem>
                  );
                }
                
                return (
                  <>
                    <MenuItem onClick={()=>{ handleItemMenuClose(); if(itemMenuTarget) openLogDialog(itemMenuTarget); }}>Log consumed / wasted</MenuItem>
                  </>
                );
              })()}
            </Menu>
          </Box>
        );
      })()}

      <Dialog open={!!selectedPurchase} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>Log Consumed / Wasted - {selectedPurchase?.name}</DialogTitle>
        <DialogContent>
          {selectedPurchase && (() => {
            const s = summaryMap[selectedPurchase.id] || {};
            const base = parseFloat(selectedPurchase.quantity) || 0;
            const consumedSoFar = parseFloat(s.consumed_qty || 0) || 0;
            const wastedSoFar = parseFloat(s.wasted_qty || 0) || 0;
            const used = consumedSoFar + wastedSoFar;
            const remaining = Math.max(0, base - used);
            const stepSize = getStepForRemaining(remaining);
            // Clamp deterministically so:
            // consumed + wasted <= remaining
            // and each is >= 0.
            const rawConsumed = Math.max(0, parseFloat(consumedNow || 0) || 0);
            const rawWasted = Math.max(0, parseFloat(wastedNow || 0) || 0);

            // First clamp consumed to remaining, then wasted to leftover,
            // then re-clamp consumed to leftover after wasted (symmetry).
            const c1 = Math.min(rawConsumed, remaining);
            const w1 = Math.min(rawWasted, Math.max(0, remaining - c1));
            const safeConsumedNow = Math.min(c1, Math.max(0, remaining - w1));
            const safeWastedNow = Math.min(w1, Math.max(0, remaining - safeConsumedNow));
            const unmarkedNow = Math.max(0, remaining - safeConsumedNow - safeWastedNow);
            const disableSave = (safeConsumedNow <= 0 && safeWastedNow <= 0) || remaining <= 0;

            return (
              <Stack spacing={2}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Remaining: {remaining.toFixed(2)} of {base.toFixed(2)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Already logged: {consumedSoFar.toFixed(2)} consumed, {wastedSoFar.toFixed(2)} wasted
                </Typography>

                {remaining <= 0 ? (
                  <Box sx={{ py: 1.5 }}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      All of this item has already been marked as consumed/wasted.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {(() => {
                      const maxConsume = Math.max(0, remaining - safeWastedNow);
                      const value = Math.min(safeConsumedNow, maxConsume);
                      return (
                        <Box sx={{ px: 1 }}>
                          <Typography variant="caption" sx={{ color: "success.dark", fontWeight: 700 }}>
                            Consumed now
                          </Typography>
                          <Slider
                            key={`consume-${selectedPurchase?.id || "x"}-${maxConsume.toFixed(4)}`}
                            value={value}
                            onChange={(_, v) => {
                              const num = Array.isArray(v) ? v[0] : v;
                              const next = Math.max(0, Math.min(Number(num) || 0, maxConsume));
                              setConsumedNow(Number(next.toFixed(4)));
                              // Clamp wasted if needed
                              setWastedNow((prev) => {
                                const maxWaste = Math.max(0, remaining - next);
                                if (maxWaste <= 1e-9) return 0;
                                return Math.min(Number(prev || 0), maxWaste);
                              });
                            }}
                            valueLabelDisplay="auto"
                            min={0}
                            max={maxConsume}
                            step={stepSize}
                            disabled={maxConsume <= 1e-9}
                            sx={{
                              '& .MuiSlider-thumb': {
                                bgcolor: 'success.main',
                                border: '2px solid',
                                borderColor: 'success.dark',
                                boxShadow: '0 2px 10px rgba(46, 125, 50, 0.35)',
                              },
                              '& .MuiSlider-track': { bgcolor: 'success.main' },
                              '& .MuiSlider-rail': { opacity: 0.35 },
                            }}
                          />
                        </Box>
                      );
                    })()}
                    <Box sx={{ px: 1 }}>
                      <Typography variant="caption" sx={{ color: "error.dark", fontWeight: 700 }}>
                        Wasted now
                      </Typography>
                      {(() => {
                        const maxWaste = Math.max(0, remaining - safeConsumedNow);
                        const value = Math.min(safeWastedNow, maxWaste);
                        return (
                      <Slider
                        key={`waste-${selectedPurchase?.id || "x"}-${maxWaste.toFixed(4)}`}
                        value={value}
                        onChange={(_, v) => {
                          const num = Array.isArray(v) ? v[0] : v;
                          const maxWaste = Math.max(0, remaining - safeConsumedNow);
                          const next = Math.max(0, Math.min(Number(num) || 0, maxWaste));
                          setWastedNow(Number(next.toFixed(4)));
                          // Clamp consumed if needed
                          setConsumedNow((prev) => {
                            const maxConsume = Math.max(0, remaining - next);
                            if (maxConsume <= 1e-9) return 0;
                            return Math.min(Number(prev || 0), maxConsume);
                          });
                        }}
                        valueLabelDisplay="auto"
                        min={0}
                        max={maxWaste}
                        step={stepSize}
                        disabled={maxWaste <= 1e-9}
                        sx={{
                          '& .MuiSlider-thumb': {
                            bgcolor: 'error.main',
                            border: '2px solid',
                            borderColor: 'error.dark',
                            boxShadow: '0 2px 10px rgba(211, 47, 47, 0.35)',
                          },
                          '& .MuiSlider-track': { bgcolor: 'error.main' },
                          '& .MuiSlider-rail': { opacity: 0.35 },
                        }}
                      />
                        );
                      })()}
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ mt: -0.5, flexWrap: 'wrap' }}>
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                        Consumed now: {safeConsumedNow.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 600 }}>
                        Wasted now: {safeWastedNow.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Unmarked: {unmarkedNow.toFixed(2)}
                      </Typography>
                    </Stack>
                  </>
                )}
				<DialogActions sx={{ px: 0, justifyContent:'space-between' }}>
          <Button
            color="error"
            variant="outlined"
            onClick={() => setResetConfirmOpen(true)}
            disabled={used <= 0 || resetting}
            sx={{ textTransform: "none" }}
          >
            Reset to unmarked
          </Button>
					<Box sx={{ display:'flex', gap: 1 }}>
            <Button
              variant="contained"
              onClick={() => submitLog()}
              disabled={disableSave || resetting}
            >
              Save
            </Button>
          </Box>
        </DialogActions>
              </Stack>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Confirm reset */}
      <Dialog
        open={resetConfirmOpen}
        onClose={() => (resetting ? null : setResetConfirmOpen(false))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reset this item?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will delete all consumed/wasted marks for this item and make it fully unmarked again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetConfirmOpen(false)} disabled={resetting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={resetMarksForSelected}
            disabled={resetting}
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>

		{/* Overall trends dialog */}
		<Dialog open={overallOpen} onClose={() => setOverallOpen(false)} fullScreen>
			<Box sx={{ 
				position: 'sticky', 
				top: 0, 
				zIndex: 1000,
				backgroundColor: 'primary.main',
				color: 'white',
				px: { xs: 2, sm: 3 },
				py: 2,
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
			<Box sx={{ display:'flex', flexDirection:'column', height:'100vh' }}>
				<Tabs value={tabIndex} onChange={(_, v)=>setTabIndex(v)} variant="fullWidth">
					<Tab label="Overall" />
					<Tab label="Trend" />
					<Tab label="Category" />
				</Tabs>
				<Box sx={{ flex:1, overflow:'hidden' }}>
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
      </Container>
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
