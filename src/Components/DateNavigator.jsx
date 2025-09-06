/* eslint-disable react/prop-types */
import React, { useState } from "react";
import {
  IconButton,
  Typography,
  Popover,
  Box,
  Paper
} from "@mui/material";
import {
  ArrowBackIosNew as ArrowBackIos,
  ArrowForwardIos
} from "@mui/icons-material";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import dayjs from "dayjs";

const DateNavigator = ({ value, onChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const isToday = dayjs(value).isSame(dayjs(), "day");

  const handlePrev = () => onChange(dayjs(value).subtract(1, "day"));
  const handleNext = () => {
    const nextDate = dayjs(value).add(1, "day");
    // TEMPORARILY ALLOW FUTURE DATES FOR DEBUGGING
    // if (nextDate.isAfter(dayjs(), "day")) {
    //   return;
    // }
    onChange(nextDate);
  };
  const handleOpenCalendar = (e) => setAnchorEl(e.currentTarget);
  const handleCloseCalendar = () => setAnchorEl(null);

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
        // TEMPORARILY REMOVE DISABLED STATE FOR DEBUGGING
        // disabled={dayjs(value).isSame(dayjs(), "day")}
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
            // TEMPORARILY ALLOW FUTURE DATES FOR DEBUGGING
            // if (dayjs(newValue).isAfter(dayjs(), "day")) {
            //   return;
            // }
            onChange(newValue);
            handleCloseCalendar();
          }}
          // TEMPORARILY REMOVE MAX DATE RESTRICTION
          // maxDate={dayjs()}
        />
      </Popover>
    </Box>
  );
};

export default DateNavigator;
