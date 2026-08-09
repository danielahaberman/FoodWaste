// @ts-nocheck
import React, { useState, memo, useEffect } from "react";
import { Box } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import BottomBar from "./Components/BottomBar";
import TabPanel from "./Components/TabPanel";
import ConsumeWaste from "./Components/Pages/ComsumeWaste";
import QaPage from "./Components/Pages/QaPage";
import FoodLog from "./Components/Pages/FoodLog";
import TasksAndLeaderboard from "./Components/Pages/TasksAndLeaderboard";
import Settings from "./Components/Pages/Settings";
import Resources from "./Components/Pages/Resources";

// memo so TabPanel can flip display without re-rendering heavy inactive trees
const TAB_ROUTES = {
  "/summary": memo(ConsumeWaste),
  "/survey": memo(QaPage),
  "/log": memo(FoodLog),
  "/home": memo(FoodLog),
  "/tasks": memo(TasksAndLeaderboard),
  "/tasks-leaderboard": memo(TasksAndLeaderboard),
  "/settings": memo(Settings),
  "/resources": memo(Resources),
};

const ALL_TABS = ["/summary", "/survey", "/log", "/tasks", "/settings", "/resources"];

function tabPathForLocation(pathname) {
  if (pathname === "/home") return "/log";
  if (pathname === "/tasks-leaderboard") return "/tasks";
  if (pathname === "/survey-progress") return "/survey";
  return ALL_TABS.includes(pathname) ? pathname : null;
}

const SidebarLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = tabPathForLocation(location.pathname);

  useEffect(() => {
    if (location.pathname === "/survey-progress") {
      navigate("/survey", { replace: true });
    }
  }, [location.pathname, navigate]);

  const [mountedTabs, setMountedTabs] = useState(() =>
    activeTab ? new Set([activeTab]) : new Set(),
  );

  // Mount the active tab during render so it appears in the same commit as the
  // URL change — useEffect would leave a blank/stale frame first.
  if (activeTab && !mountedTabs.has(activeTab)) {
    setMountedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }

  const isTabVisible = (path) => {
    if (location.pathname === path) return true;
    if (path === "/log" && location.pathname === "/home") return true;
    if (path === "/tasks" && location.pathname === "/tasks-leaderboard") return true;
    if (path === "/survey" && location.pathname === "/survey-progress") return true;
    return false;
  };

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
        backgroundColor: { xs: "transparent", sm: "var(--color-muted)" },
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
        {ALL_TABS.map((path) => {
          if (!mountedTabs.has(path)) return null;

          const TabComponent = TAB_ROUTES[path];
          if (!TabComponent) return null;

          return (
            <TabPanel
              key={path}
              visible={isTabVisible(path)}
              Component={TabComponent}
            />
          );
        })}
      </Box>
      <BottomBar />
    </Box>
  );
};

export default SidebarLayout;
