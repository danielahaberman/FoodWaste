// @ts-nocheck
import React, { useMemo } from "react";
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

// Small app — mount every tab up front for instant switching.
const ALL_TABS = ["/summary", "/survey", "/log", "/tasks", "/settings", "/resources"];

const SidebarLayout = () => {
  const location = useLocation();

  const tabPanels = useMemo(
    () =>
      ALL_TABS.map((path) => {
        const TabComponent = TAB_ROUTES[path];
        if (!TabComponent) return null;

        return (
          <TabPanel key={path} path={path}>
            <TabComponent />
          </TabPanel>
        );
      }),
    [],
  );

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
        {tabPanels.map((panel) =>
          panel ? React.cloneElement(panel, { visible: isTabVisible(panel.props.path) }) : null,
        )}
        <Outlet />
      </Box>
      <BottomBar />
    </Box>
  );
};

export default SidebarLayout;
