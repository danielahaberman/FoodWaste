// @ts-nocheck
import React from "react";
import { Box } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import BottomBar from "./Components/BottomBar";
import TabPanel from "./Components/TabPanel";
import ConsumeWaste from "./Components/Pages/ComsumeWaste";
import QaPage from "./Components/Pages/QaPage";
import FoodLog from "./Components/Pages/FoodLog";
import TasksAndLeaderboard from "./Components/Pages/TasksAndLeaderboard";
import Settings from "./Components/Pages/Settings";
import Resources from "./Components/Pages/Resources";

const TAB_ROUTES = {
  "/summary": ConsumeWaste,
  "/survey": QaPage,
  "/log": FoodLog,
  "/home": FoodLog,
  "/tasks": TasksAndLeaderboard,
  "/tasks-leaderboard": TasksAndLeaderboard,
  "/settings": Settings,
  "/resources": Resources,
};

// Pre-mount bottom-nav tabs so switching is instant (no first-visit mount delay).
const BOTTOM_NAV_TABS = ["/summary", "/survey", "/log", "/tasks", "/settings"];

const resolveTabPath = (pathname) => {
  if (TAB_ROUTES[pathname]) return pathname;
  return null;
};

const SidebarLayout = () => {
  const location = useLocation();

  const isTabVisible = (path) => {
    if (location.pathname === path) return true;
    if (path === "/log" && location.pathname === "/home") return true;
    if (path === "/tasks" && location.pathname === "/tasks-leaderboard") return true;
    return false;
  };

  const extraTabs = [];
  const currentTab = resolveTabPath(location.pathname);
  if (currentTab && !BOTTOM_NAV_TABS.includes(currentTab)) {
    extraTabs.push(currentTab);
  }

  const mountedTabs = [...BOTTOM_NAV_TABS, ...extraTabs];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        minHeight: "100vh",
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: { xs: "transparent", sm: "#f5f5f5" },
        overflow: "hidden",
      }}
    >
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {mountedTabs.map((path) => {
          const TabComponent = TAB_ROUTES[path];
          if (!TabComponent) return null;
          const visible = isTabVisible(path);

          return (
            <TabPanel key={path} visible={visible}>
              <TabComponent />
            </TabPanel>
          );
        })}
        {/* Required for React Router layout routes to match child paths */}
        <Outlet />
      </Box>
      <BottomBar />
    </Box>
  );
};

export default SidebarLayout;
