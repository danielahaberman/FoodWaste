/* eslint-disable react/prop-types */
import React, { useState } from "react";
import {
  IconButton,
  Typography,
  Popover,
  Box,
  Paper,
  Badge,
  Button,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ArrowBackIosNew as ArrowBackIos,
  ArrowForwardIos,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import dayjs from "dayjs";

const DateNavigator = ({ value, onChange, datesWithFood = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const today = dayjs();
  const isToday = dayjs(value).isSame(today, "day");
  const isFuture = dayjs(value).isAfter(today, "day");

  const handlePrev = () => onChange(dayjs(value).subtract(1, "day"));
  const handleNext = () => {
    const nextDate = dayjs(value).add(1, "day");
    if (!nextDate.isAfter(today, "day")) onChange(nextDate);
  };

  const ServerDay = (props) => {
    const { day, outsideCurrentMonth, ...other } = props;
    const dateStr = dayjs(day).format("YYYY-MM-DD");
    const hasFood = datesWithFood.includes(dateStr);

    return (
      <Badge
        overlap="circular"
        badgeContent={hasFood ? "●" : undefined}
        sx={{
          "& .MuiBadge-badge": {
            backgroundColor: "transparent",
            color: "primary.main",
            fontSize: "8px",
            height: "6px",
            minWidth: "6px",
            padding: 0,
            top: "85%",
            right: "50%",
            transform: "translate(50%, -50%)",
          },
        }}
      >
        <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
      </Badge>
    );
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Box display="flex" alignItems="center" gap={0.5} sx={{ flex: 1, minWidth: 0 }}>
          <IconButton
            onClick={handlePrev}
            size="small"
            aria-label="Previous day"
            sx={{
              backgroundColor: "rgba(25, 118, 210, 0.08)",
              "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.15)" },
            }}
          >
            <ArrowBackIos sx={{ fontSize: 14, ml: 0.5 }} />
          </IconButton>

          <Paper
            elevation={0}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              flex: 1,
              cursor: "pointer",
              px: 1.5,
              py: 1,
              borderRadius: 2.5,
              backgroundColor: "rgba(25, 118, 210, 0.06)",
              border: "1px solid rgba(25, 118, 210, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              minWidth: 0,
              transition: "background-color 0.2s ease",
              "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.1)" },
            }}
          >
            <CalendarIcon sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }} />
            <Typography
              variant="subtitle2"
              fontWeight={600}
              color="text.primary"
              noWrap
              sx={{ fontSize: isMobile ? "0.85rem" : "0.9rem" }}
            >
              {isToday ? "Today" : dayjs(value).format("ddd, MMM D")}
            </Typography>
          </Paper>

          <IconButton
            onClick={handleNext}
            size="small"
            disabled={isToday}
            aria-label="Next day"
            sx={{
              backgroundColor: "rgba(25, 118, 210, 0.08)",
              "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.15)" },
            }}
          >
            <ArrowForwardIos sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>

        {!isToday && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => onChange(today)}
            sx={{
              flexShrink: 0,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.75rem",
              minWidth: "auto",
              px: 1.25,
            }}
          >
            Today
          </Button>
        )}
      </Stack>

      {!isToday && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", mt: 0.75 }}
        >
          {dayjs(value).format("MMMM D, YYYY")}
          {isFuture ? " · Future dates can't be edited" : ""}
        </Typography>
      )}

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{
          elevation: 4,
          sx: { mt: 1, borderRadius: 3, overflow: "hidden" },
        }}
      >
        <StaticDatePicker
          displayStaticWrapperAs={isMobile ? "mobile" : "desktop"}
          value={value}
          onChange={(newValue) => {
            if (dayjs(newValue).isAfter(today, "day")) return;
            onChange(newValue);
            setAnchorEl(null);
          }}
          maxDate={today}
          slots={{ day: ServerDay }}
        />
      </Popover>
    </Box>
  );
};

export default DateNavigator;
