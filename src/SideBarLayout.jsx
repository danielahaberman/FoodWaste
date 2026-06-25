// @ts-nocheck
import React, { useEffect, useState } from "react";
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

const ALL_TABS = ["/summary", "/survey", "/log", "/tasks", "/settings", "/resources"];

function tabPathForLocation(pathname) {
  if (pathname === "/home") return "/log";
  if (pathname === "/tasks-leaderboard") return "/tasks";
  return ALL_TABS.includes(pathname) ? pathname : null;
}

const SidebarLayout = () => {
  const location = useLocation();
  const activeTab = tabPathForLocation(location.pathname);

  const [mountedTabs, setMountedTabs] = useState(() =>
    activeTab ? new Set([activeTab]) : new Set(),
  );

  useEffect(() => {
    if (!activeTab) return;
    setMountedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  const isTabVisible = (path) => {
    if (location.pathname === path) return true;
    if (path === "/log" && location.pathname === "/home") return true;
    if (path === "/tasks" && location.pathname === "/tasks-leaderboard") return true;
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
        {ALL_TABS.map((path) => {
          if (!mountedTabs.has(path)) return null;

          const TabComponent = TAB_ROUTES[path];
          if (!TabComponent) return null;

          return (
            <TabPanel key={path} visible={isTabVisible(path)}>
              <TabComponent />
            </TabPanel>
          );
        })}
        <Outlet />
      </Box>
      <BottomBar />
    </Box>
  );
};

export default SidebarLayout;
