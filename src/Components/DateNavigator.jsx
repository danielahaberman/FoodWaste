/* eslint-disable react/prop-types */
import React, { useState } from "react";
import {
  IconButton,
  Typography,
  Popover,
  Box,
  Paper,
  Badge
} from "@mui/material";
import {
  ArrowBackIosNew as ArrowBackIos,
  ArrowForwardIos
} from "@mui/icons-material";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import dayjs from "dayjs";

const DateNavigator = ({ value, onChange, datesWithFood = [] }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const isToday = dayjs(value).isSame(dayjs(), "day");

  const handlePrev = () => onChange(dayjs(value).subtract(1, "day"));
  const handleNext = () => {
    const nextDate = dayjs(value).add(1, "day");
    // Don't allow selecting future dates
    if (nextDate.isAfter(dayjs(), "day")) {
      return;
    }
    onChange(nextDate);
  };
  const handleOpenCalendar = (e) => setAnchorEl(e.currentTarget);
  const handleCloseCalendar = () => setAnchorEl(null);

  // Custom day renderer to show blue dots on days with food purchases
  const ServerDay = (props) => {
    const { day, outsideCurrentMonth, ...other } = props;
    const dateStr = dayjs(day).format('YYYY-MM-DD');
    const hasFood = datesWithFood.includes(dateStr);

    return (
      <Badge
        key={day.toString()}
        overlap="circular"
        badgeContent={hasFood ? '●' : undefined}
        sx={{
          '& .MuiBadge-badge': {
            backgroundColor: 'transparent',
            color: '#1976d2',
            fontSize: '8px',
            height: '6px',
            minWidth: '6px',
            padding: 0,
            top: '85%',
            right: '50%',
            transform: 'translate(50%, -50%)'
          }
        }}
      >
        <PickersDay
          {...other}
          outsideCurrentMonth={outsideCurrentMonth}
          day={day}
        />
      </Badge>
    );
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <IconButton onClick={handlePrev} size="small" color="primary">
        <ArrowBackIos fontSize="small" />
      </IconButton>

     <Box
  onClick={handleOpenCalendar}
  sx={{
    cursor: "pointer",
    px: 2,
    py: 1,
    borderRadius: "999px",
    backgroundColor: "background.paper",
    border: "1px solid",
    borderColor: "divider",
    "&:hover": {
      backgroundColor: "grey.100"
    },
    userSelect: "none",
    transition: "background-color 0.2s ease",
    width: "120px", // ✅ Fixed width
    textAlign: "center", // ✅ Center text
    overflow: "hidden", // Prevent layout shift
    whiteSpace: "nowrap",
  }}
>
  <Typography
    variant="body2"
    fontWeight={500}
    color="text.primary"
    noWrap
  >
    {isToday ? "Today" : dayjs(value).format("MMM D, YYYY")}
  </Typography>
</Box>

      <IconButton 
        onClick={handleNext} 
        size="small" 
        color="primary"
        disabled={dayjs(value).isSame(dayjs(), "day")}
      >
        <ArrowForwardIos fontSize="small" />
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleCloseCalendar}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center"
        }}
        PaperProps={{
          elevation: 4,
          sx: {
            mt: 1,
            borderRadius: 2,
            overflow: "hidden"
          }
        }}
      >
        <StaticDatePicker
          displayStaticWrapperAs="desktop"
          value={value}
          onChange={(newValue) => {
            // Don't allow selecting future dates
            if (dayjs(newValue).isAfter(dayjs(), "day")) {
              return;
            }
            onChange(newValue);
            handleCloseCalendar();
          }}
          maxDate={dayjs()}
          slots={{
            day: ServerDay
          }}
        />
      </Popover>
    </Box>
  );
};

export default DateNavigator;
