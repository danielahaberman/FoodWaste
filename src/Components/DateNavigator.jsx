/* eslint-disable react/prop-types */
import React, { useState } from "react";
import {
  IconButton,
  Typography,
  Popover,
  Box
} from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import dayjs from "dayjs";

const DateNavigator = ({ value, onChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const isToday = dayjs(value).isSame(dayjs(), "day");

  const handlePrev = () => {
    onChange(dayjs(value).subtract(1, "day"));
  };

  const handleNext = () => {
    onChange(dayjs(value).add(1, "day"));
  };

  const handleOpenCalendar = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseCalendar = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <IconButton onClick={handlePrev}>
        <ArrowBackIos fontSize="small" />
      </IconButton>

      <Typography
        variant="body1"
        onClick={handleOpenCalendar}
        sx={{
          cursor: "pointer",
          userSelect: "none",
          fontWeight: 500
        }}
      >
        {isToday ? "Today" : dayjs(value).format("MMM D, YYYY")}
      </Typography>

      <IconButton onClick={handleNext}>
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
      >
        <Box p={2}>
          <StaticDatePicker
            displayStaticWrapperAs="desktop"
            value={value}
            onChange={(newValue) => {
              onChange(newValue);
              handleCloseCalendar();
            }}
            // renderInput={() => null} // This will hide the input field
          />
        </Box>
      </Popover>
    </Box>
  );
};

export default DateNavigator;
