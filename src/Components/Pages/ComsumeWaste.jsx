import React, { useEffect, useState } from "react";
import axios from "axios";
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function ConsumeWaste({ handleBack }) {
  const [weeklySummary, setWeeklySummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchWeeklyPurchaseSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { user_id: localStorage.getItem("userId") };
      const response = await axios.get(`${API_URL}/purchases/weekly-summary`, { params });
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
    <Box sx={{ maxWidth: 700, mx: "auto", mt: 2, mb: 6, px: 2 }}>
      {/* Header Bar */}
      <AppBar position="sticky" color="primary" sx={{ mb: 3 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleBack} aria-label="back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Weekly Consumption Summary
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Weekly Summary */}
      {weeklySummary.map((week) => (
        <Paper
          key={week.weekOf}
          elevation={2}
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 2,
            backgroundColor: "background.paper",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            color="primary.main"
            gutterBottom
            sx={{ borderBottom: 2, borderColor: "primary.main", pb: 0.5 }}
          >
            {week.weekOf}
          </Typography>

          <List disablePadding>
            {week.purchases.map((item) => (
              <ListItem
                key={item.id}
                sx={{
                  bgcolor: "background.default",
                  mb: 1,
                  borderRadius: 1,
                  boxShadow: 1,
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography fontWeight={600} color="text.primary">
                      {item.name}
                    </Typography>
                  }
                  secondary={`Amount: ${item.quantity}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      ))}
    </Box>
  );
}

export default ConsumeWaste;
