import React, { useEffect, useMemo, useState } from "react";
import { foodPurchaseAPI, consumptionAPI } from "../../api";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  AppBar,
  Toolbar,
  Button,
  Slider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButtonGroup,
  ToggleButton,
  Menu,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";
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

function ConsumeWaste({ handleBack, onGoToDate }) {
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [actionType, setActionType] = useState("consumed"); // or 'wasted'
  const [sliderUnits, setSliderUnits] = useState(0);
  const [manualQty, setManualQty] = useState("");
  const userId = localStorage.getItem("userId");

  const fetchWeeklyPurchaseSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { user_id: localStorage.getItem("userId") };
      const response = await foodPurchaseAPI.getWeeklySummary(params);
      setWeeklySummary(response.data);
    } catch (err) {
      console.error("Error fetching weekly summary:", err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyPurchaseSummary();
  }, []);

  const purchasesFlat = useMemo(() => weeklySummary.flatMap(w => w.purchases), [weeklySummary]);

  const fetchBatchSummaries = async () => {
    if (!purchasesFlat.length) return {};
    const ids = purchasesFlat.map(p => p.id).join(",");
    const res = await consumptionAPI.getBatchSummary({ user_id: userId, purchase_ids: ids });
    const map = {};
    res.data.forEach(r => { map[r.purchase_id] = r; });
    return map;
  };

  const [summaryMap, setSummaryMap] = useState({});
  const [weekCharts, setWeekCharts] = useState({}); // { [weekOf]: chartData }
  const [weekChartTotals, setWeekChartTotals] = useState({}); // { [weekOf]: { consumed, wasted, unmarked } }
  const [trendData, setTrendData] = useState(null);
  const [overallChart, setOverallChart] = useState(null);
  const [overallTotals, setOverallTotals] = useState(null); // { consumed, wasted }
  const [overallOpen, setOverallOpen] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState('week'); // 'day' | 'week'
  const [activeWeekOf, setActiveWeekOf] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const openMenu = Boolean(menuAnchor);
  const handleMenuOpen = (e) => setMenuAnchor(e.currentTarget);
  const handleMenuClose = () => setMenuAnchor(null);

  // Per-item action menu
  const [itemMenuAnchor, setItemMenuAnchor] = useState(null);
  const [itemMenuTarget, setItemMenuTarget] = useState(null);
  const openItemMenu = Boolean(itemMenuAnchor);
  const handleItemMenuOpen = (e, item) => { setItemMenuAnchor(e.currentTarget); setItemMenuTarget(item); };
  const handleItemMenuClose = () => { setItemMenuAnchor(null); setItemMenuTarget(null); };

  const formatNum = (n) => {
    const v = parseFloat(n || 0);
    if (Number.isNaN(v)) return "0";
    const rounded = Math.round(v * 100) / 100;
    return Math.abs(rounded - Math.round(rounded)) < 1e-9 ? String(Math.round(rounded)) : rounded.toFixed(2);
  };

  const formatMoney = (n) => `$${formatNum(n)}`;

  const Legend = () => (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1, color:"black" }}>
      <Box display="inline-flex" alignItems="center" gap={0.5}>
        <ShoppingCartIcon sx={{ color: 'primary.main', fontSize: 18 }} />
        <Typography variant="caption">Purchased</Typography>
      </Box>
      <Box display="inline-flex" alignItems="center" gap={0.5}>
        <RestaurantIcon sx={{ color: 'success.main', fontSize: 18 }} />
        <Typography variant="caption">Consumed</Typography>
      </Box>
      <Box display="inline-flex" alignItems="center" gap={0.5}>
        <DeleteForeverIcon sx={{ color: 'error.main', fontSize: 18 }} />
        <Typography variant="caption">Wasted</Typography>
      </Box>
    </Stack>
  );
  useEffect(() => {
    (async () => {
      const m = await fetchBatchSummaries();
      setSummaryMap(m);
    })();
  }, [purchasesFlat.length]);

  useEffect(() => {
    (async () => {
      if (!weeklySummary.length) return;
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

  const loadTrend = async (period) => {
    const trendRes = await consumptionAPI.getTrends({ user_id: userId, period, count: period === 'day' ? 30 : 12 });
    const t = trendRes.data || [];
    setTrendData({
      labels: t.map(x => new Date(x.bucket).toLocaleDateString()),
      datasets: [
        {
          label: "% Wasted",
          data: t.map(x => parseFloat((x.percent_wasted || 0).toFixed(2))),
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
      loadTrend(trendPeriod);
    }
  }, [overallOpen, trendPeriod]);

  const ensureWeekChart = async (weekOf, refresh = false) => {
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

  const openLogDialog = (purchase, action) => {
    setSelectedPurchase(purchase);
    setActionType(action);
    // Prefill based on existing logs to allow editing by lowering
    const s = summaryMap[purchase.id] || {};
    const base = parseFloat(purchase.quantity) || 0;
    const used = (parseFloat(s.consumed_qty || 0) + parseFloat(s.wasted_qty || 0)) || 0;
    const remaining = Math.max(0, base - used);
    const currentForAction = action === 'consumed' ? parseFloat(s.consumed_qty || 0) : parseFloat(s.wasted_qty || 0);
    const stepSize = remaining > 0 ? remaining / 10 : (base > 0 ? base / 10 : 0.1);
    // Set slider to current logged amount for this action, clamped to max allowed (current + remaining)
    const maxAllowed = currentForAction + remaining;
    const startVal = Math.min(currentForAction, maxAllowed);

    setSliderUnits(Number((Math.round(startVal / stepSize) * stepSize).toFixed(4)) || 0);
    // Leave manual empty so slider controls initial value; user can type to override
    setManualQty("");
  };

  const closeDialog = () => {
    setSelectedPurchase(null);
  };

  const submitLog = async (desiredAbsoluteOverride) => {
    if (!selectedPurchase) return;
    const payload = {
      user_id: userId,
      purchase_id: selectedPurchase.id,
      action: actionType,
    };
    // Compute desired absolute amount for this action and convert to delta for logging
    const s = summaryMap[selectedPurchase.id] || {};
    const currentForAction = actionType === 'consumed' ? parseFloat(s.consumed_qty || 0) : parseFloat(s.wasted_qty || 0);
    const desiredAbsolute = (desiredAbsoluteOverride !== undefined && desiredAbsoluteOverride !== null)
      ? desiredAbsoluteOverride
      : (manualQty !== "" ? parseFloat(manualQty) : sliderUnits);
    const delta = (desiredAbsolute || 0) - (currentForAction || 0);
    payload.quantity = delta;
    try {
      await consumptionAPI.log(payload);
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to log");
      return;
    }
    closeDialog();
    await fetchWeeklyPurchaseSummary();
    const m = await fetchBatchSummaries();
    setSummaryMap(m);
    if (activeWeekOf) {
      await ensureWeekChart(activeWeekOf, true);
    }
  };

  const markWeekAsWasted = async (weekOf) => {
    await consumptionAPI.autoWasteWeek({ user_id: userId, week_start: weekOf });
    await fetchWeeklyPurchaseSummary();
    const m = await fetchBatchSummaries();
    setSummaryMap(m);
    await ensureWeekChart(weekOf, true);
  };

  if (loading)
    return (
      <Box textAlign="center" py={4}>
        <CircularProgress />
        <Typography variant="body2" mt={2} fontStyle="italic">
          Loading weekly purchase summary...
        </Typography>
      </Box>
    );

  if (error)
    return (
      <Typography color="error" textAlign="center" py={4}>
        {error}
      </Typography>
    );

  return (
    <Box sx={{
      
      backgroundColor:"white", zIndex:"999",
   mx: "auto",
      
      
   px: 2, padding:"0px",
      position:"absolute",
      top:"0px",
      height:"100vh",
      boxSizing:"border-box", left:"0px", width:"100vw"
      
       }}>
      {/* Header Bar with Trends */}
      <AppBar position="sticky" color="primary" sx={{ mb: 2 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => activeWeekOf ? setActiveWeekOf(null) : handleBack()} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {activeWeekOf ? `Week of ${activeWeekOf}` : 'Weekly Consumption Summary'}
          </Typography>
          {!activeWeekOf && (
            <Button color="inherit" onClick={() => setOverallOpen(true)}>Trends</Button>
          )}
        </Toolbar>
      </AppBar>

      {!activeWeekOf && (
        <Legend />
      )}

      {!activeWeekOf && (
        <Box sx={{ backgroundColor: 'grey.50', borderRadius: 2, p: 1, mb: 2 }}>
      {weeklySummary.map((week) => (
        <Paper
          key={week.weekOf}
          elevation={2}
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            backgroundColor: "background.paper",
            cursor: 'pointer',
          }}
          onClick={() => openWeekDetails(week.weekOf)}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography
            variant="h6"
            fontWeight={700}
            color="primary.main"
            gutterBottom
            sx={{ borderBottom: 2, borderColor: "primary.main", pb: 0.5 }}
          >
            {week.weekOf}
          </Typography>
            <Stack direction="row" spacing={0.5}>
              <Button size="small" variant="text" onClick={(e)=>{ e.stopPropagation(); if(onGoToDate) onGoToDate(week.weekOf); }}>
                Go to week
              </Button>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e); }}>
                <MoreVertIcon />
              </IconButton>
            </Stack>
          </Stack>
          <Menu anchorEl={menuAnchor} open={openMenu} onClose={handleMenuClose} onClick={(e)=>e.stopPropagation()}>
            <MenuItem onClick={() => { handleMenuClose(); markWeekAsWasted(week.weekOf); }}>Mark remaining as wasted</MenuItem>
          </Menu>
          {/* Summary line with icons */}
          <Typography variant="body2" color="text.primary" display="flex" alignItems="center" gap={2}>
            <Box component="span" display="inline-flex" alignItems="center" gap={0.5}>
              <ShoppingCartIcon sx={{ color: 'primary.main', fontSize: 18 }} />
              {week.purchases.length}
            </Box>
            {(() => {
              const ids = week.purchases.map(p => p.id);
              let c = 0, w = 0, cc = 0, wc = 0;
              ids.forEach(id => {
                const s = summaryMap[id] || {};
                c += parseFloat(s.consumed_qty || 0);
                w += parseFloat(s.wasted_qty || 0);
                cc += parseFloat(s.consumed_cost || 0);
                wc += parseFloat(s.wasted_cost || 0);
              });
              return (
                <>
                  <Box component="span" display="inline-flex" alignItems="center" gap={0.5}>
                    <RestaurantIcon sx={{ color: 'success.main', fontSize: 18 }} />
                    {formatNum(c)} ({formatMoney(cc)})
                  </Box>
                  <Box component="span" display="inline-flex" alignItems="center" gap={0.5}>
                    <DeleteForeverIcon sx={{ color: 'error.main', fontSize: 18 }} />
                    {formatNum(w)} ({formatMoney(wc)})
                  </Box>
                </>
              );
            })()}
          </Typography>
        </Paper>
          ))}
        </Box>
      )}

      {activeWeekOf && (() => {
        const week = weeklySummary.find(w => w.weekOf === activeWeekOf);
        if (!week) return null;
        return (
          <div  sx={{  borderRadius: 2 }}>
            <Legend />
            {weekCharts[activeWeekOf] && (() => {
              const d = weekCharts[activeWeekOf]?.datasets?.[0]?.data || [];
              const total = Array.isArray(d) ? d.reduce((a, b) => a + (parseFloat(b) || 0), 0) : 0;
              if (total > 0.0001) {
                return (
                  <Box sx={{ maxWidth: 180, mx: "auto", mb: 2, color:"black" }}>
                    <Typography variant="subtitle2" sx={{ textAlign: "center", mb: 1 }}>This week: $ Consumed vs $ Wasted</Typography>
                    <Pie data={weekCharts[activeWeekOf]} options={{ responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } }} />
                    {(() => {
                      const totals = weekChartTotals[activeWeekOf] || { consumed: d[0] || 0, wasted: d[1] || 0, unmarked: d[2] || 0 };
                      return (
                        <Stack spacing={0.25} sx={{ mt: 1 }}>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 10, height: 10, bgcolor: '#4caf50', borderRadius: '50%' }} /> Consumed: {formatMoney(totals.consumed)}
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 10, height: 10, bgcolor: '#ef5350', borderRadius: '50%' }} /> Wasted: {formatMoney(totals.wasted)}
                          </Typography>
                          {totals.unmarked > 0.0001 && (
                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Box sx={{ width: 10, height: 10, bgcolor: '#42a5f5', borderRadius: '50%' }} /> Unmarked: {formatMoney(totals.unmarked)}
                            </Typography>
                          )}
                        </Stack>
                      );
                    })()}
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
              <MenuItem onClick={()=>{ handleItemMenuClose(); if(itemMenuTarget) openLogDialog(itemMenuTarget,'consumed'); }}>Mark Consumed</MenuItem>
              <MenuItem onClick={()=>{ handleItemMenuClose(); if(itemMenuTarget) openLogDialog(itemMenuTarget,'wasted'); }}>Mark Wasted</MenuItem>
            </Menu>
          </div>
        );
      })()}

      <Dialog open={!!selectedPurchase} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{actionType === 'consumed' ? 'Log Consumed' : 'Log Wasted'} - {selectedPurchase?.name}</DialogTitle>
        <DialogContent>
          {selectedPurchase && (() => {
            const s = summaryMap[selectedPurchase.id] || {};
            const base = parseFloat(selectedPurchase.quantity) || 0;
            const used = (parseFloat(s.consumed_qty || 0) + parseFloat(s.wasted_qty || 0)) || 0;
            const remaining = Math.max(0, base - used);
            // Slider granularity: always in tenths of remaining (1/10th of max allowed)
            const stepSize = remaining > 0 ? remaining / 10 : (base > 0 ? base / 10 : 0.1);
            const qtyNum = manualQty === "" ? NaN : parseFloat(manualQty);
            const otherForAction = actionType === 'consumed' ? parseFloat(s.wasted_qty || 0) : parseFloat(s.consumed_qty || 0);
            const currentForAction = actionType === 'consumed' ? parseFloat(s.consumed_qty || 0) : parseFloat(s.wasted_qty || 0);
            const sliderMax = Math.max(0, base - otherForAction); // absolute max allowed for this action
            const sliderClamped = Math.min(Math.max(sliderUnits, 0), sliderMax);
            const chosen = isNaN(qtyNum) ? sliderClamped : Math.min(qtyNum, sliderMax);
            const overQty = !isNaN(qtyNum) && qtyNum > sliderMax + 1e-9;
            const disableSave = chosen <= 0 && currentForAction <= 0 && remaining <= 0;

            return (
              <Stack spacing={2}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Remaining: {remaining.toFixed(2)} of {base.toFixed(2)}
                </Typography>
                <Box px={1}>
                  <Slider
                    value={sliderClamped}
                    onChange={(_, v) => {
                      const num = Array.isArray(v) ? v[0] : v;
                      const safe = Math.max(0, Math.min(Number(num) || 0, sliderMax));
                      const quant = stepSize > 0 ? Math.round(safe / stepSize) * stepSize : safe;
                      setSliderUnits(Number(quant.toFixed(4)));
                    }}
                    valueLabelDisplay="auto"
                    min={0}
                    max={sliderMax}
                    step={stepSize}
                  />
                </Box>
                <TextField
                  label={`Units (max ${sliderMax.toFixed(2)})`}
                  type="number"
                  value={manualQty}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (isNaN(val)) { setManualQty(""); return; }
                    const clamped = Math.max(0, Math.min(val, sliderMax));
                    const quant = stepSize > 0 ? Math.round(clamped / stepSize) * stepSize : clamped;
                    setManualQty(String(Number(quant.toFixed(4))));
                  }}
                  inputProps={{ min: 0, max: sliderMax, step: stepSize }}
                  error={overQty}
                  helperText={overQty ? `Exceeds allowed: ${sliderMax.toFixed(2)}` : ""}
                  fullWidth
                  size="small"
                />
				<DialogActions sx={{ px: 0, justifyContent:'flex-end' }}>
					<Box sx={{ display:'flex', gap: 1 }}>
                    <Button variant="text" onClick={() => submitLog(currentForAction + remaining)} disabled={remaining <= 0}>
                      Mark remaining as {actionType === 'consumed' ? 'consumed' : 'wasted'}
                    </Button>
                    <Button variant="contained" onClick={() => submitLog()} disabled={disableSave}>Save</Button>
                  </Box>
                </DialogActions>
              </Stack>
            );
          })()}
        </DialogContent>
      </Dialog>

		{/* Overall trends dialog */}
		<Dialog open={overallOpen} onClose={() => setOverallOpen(false)} fullScreen>
			<AppBar position="sticky" color="primary">
				<Toolbar>
					<Typography variant="h6" sx={{ flexGrow: 1 }}>All-time Trends</Typography>
					<IconButton edge="end" color="inherit" onClick={() => setOverallOpen(false)} aria-label="close">
						<CloseIcon />
					</IconButton>
				</Toolbar>
			</AppBar>
			<DialogContent>
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
            <ToggleButtonGroup
              value={trendPeriod}
              exclusive
              onChange={(_, v) => v && setTrendPeriod(v)}
              color="primary"
              size="small"
              sx={{ alignSelf: 'center' }}
            >
              <ToggleButton value="day">By Day</ToggleButton>
              <ToggleButton value="week">By Week</ToggleButton>
            </ToggleButtonGroup>
            {trendData && (
              <Box sx={{ maxWidth: 700, mx: "auto" }}>
                <Typography variant="subtitle2" sx={{ textAlign: "center", mb: 1 }}>Trend: % Wasted ({trendPeriod})</Typography>
                <Line data={trendData} options={{ scales: { y: { min: 0, max: 100, ticks: { callback: (v) => v + '%' } } } }} />
              </Box>
            )}

            {/* Waste by Category (last 30 days) */}
            {byCategory.length > 0 && (
              <Box sx={{ maxWidth: 700, mx: "auto" }}>
                <Typography variant="subtitle2" sx={{ textAlign: "center", mb: 1 }}>Waste by Category (last 30 days)</Typography>
                <List dense>
                  {byCategory.map((row) => (
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
                            {(() => {
                              const max = Math.max(...byCategory.map(c => parseFloat(c.wasted_cost || 0)));
                              const pct = max > 0 ? (parseFloat(row.wasted_cost || 0) / max) * 100 : 0;
                              return <Box sx={{ width: `${pct}%`, height: '100%', backgroundColor: '#ef5350', borderRadius: 3 }} />;
                            })()}
                          </Box>
                        }
                />
              </ListItem>
            ))}
          </List>

                {/* Suggestions based on user's data and known categories */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, textAlign:'center' }}>Suggestions to reduce waste</Typography>
                  {(() => {
                    const tips = [];
                    const ranked = [...byCategory]
                      .filter(r => parseFloat(r.wasted_cost || 0) > 0)
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
                        addTip(cat, `You’ve wasted about ${formatMoney(wastedCost)} on ${cat.toLowerCase()} in the last 30 days. Front‑load recipes to use these within 2–3 days.`);
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
              </Box>
            )}

            {byCategory.length === 0 && (
              <Typography variant="body2" sx={{ textAlign:'center', color:'text.secondary' }}>
                No category waste data yet.
              </Typography>
            )}
          </Stack>
			</DialogContent>
      </Dialog>
    </Box>
  );
}

export default ConsumeWaste;
