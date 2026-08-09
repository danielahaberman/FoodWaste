// @ts-nocheck
import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import {
  ChecklistRounded as ChecklistIcon,
  EmojiEventsOutlined as TrophyIcon,
} from "@mui/icons-material";
import DailyTasks from "../DailyTasks";
import Leaderboard from "./Leaderboard";
import PageWrapper from "../PageWrapper";

const TasksAndLeaderboard = () => {
  const [tabValue, setTabValue] = useState(0);

  const subHeader = (
    <Box
      sx={{
        py: 1,
        p: 0.5,
        borderRadius: 3,
        backgroundColor: "rgba(0, 0, 0, 0.04)",
      }}
    >
      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
        variant="fullWidth"
        TabIndicatorProps={{ sx: { display: "none" } }}
        sx={{
          minHeight: 44,
          "& .MuiTabs-flexContainer": { gap: 0.5 },
          "& .MuiTab-root": {
            minHeight: 44,
            py: 1,
            px: 1.5,
            borderRadius: 2.5,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.875rem",
            color: "text.secondary",
            transition: "background-color 0.2s ease, color 0.2s ease",
            "&.Mui-selected": {
              color: "primary.main",
              backgroundColor: "var(--color-primary-light)",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            },
          },
        }}
      >
        <Tab
          disableRipple
          icon={<ChecklistIcon sx={{ fontSize: 20 }} />}
          iconPosition="start"
          label="Daily Tasks"
        />
        <Tab
          disableRipple
          icon={<TrophyIcon sx={{ fontSize: 20 }} />}
          iconPosition="start"
          label="Leaderboard"
        />
      </Tabs>
    </Box>
  );

  return (
    <PageWrapper title="Tasks & Leaderboard" subHeader={subHeader}>
      {tabValue === 0 ? <DailyTasks showCloseButton={false} /> : <Leaderboard />}
    </PageWrapper>
  );
};

export default TasksAndLeaderboard;
