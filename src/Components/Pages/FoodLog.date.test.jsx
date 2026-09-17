import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import FoodLog from "./FoodLog";
import { TabVisibilityContext } from "../../context/TabVisibilityContext";
import { getAppToday } from "../../utils/appDate";

vi.mock("../../api", () => ({
  foodPurchaseAPI: {
    getFoodPurchases: vi.fn(async () => ({
      data: [
        {
          purchase_id: 1,
          purchase_date: "2026-09-15",
          price: "3.50",
          food_name: "Test Apple",
        },
        {
          purchase_id: 2,
          purchase_date: "2026-09-10",
          price: "2.00",
          food_name: "Test Bread",
        },
      ],
    })),
    getFoodItems: vi.fn(async () => ({ data: [] })),
    deletePurchase: vi.fn(async () => ({})),
  },
}));

vi.mock("../../hooks/useSessionData", () => ({
  useSessionData: () => ({
    data: {
      surveyStatus: { needsSurvey: false },
      todayTasks: [],
    },
    loading: false,
    refresh: vi.fn(),
  }),
}));

vi.mock("../../utils/authUtils", () => ({
  getCurrentUserId: () => "42",
}));

vi.mock("../../utils/reminderUtils", () => ({
  shouldOfferDailyTasksPopup: () => false,
  SURVEY_REMINDER_OPEN: "surveyReminderOpen",
  SURVEY_REMINDER_CLOSE: "surveyReminderClose",
}));

vi.mock("../DailyTasksPopup", () => ({
  default: () => null,
}));

vi.mock("../FoodPurchaseList", () => ({
  default: ({ purchases }) => (
    <div data-testid="purchase-list">
      {purchases.map((p) => (
        <div key={p.purchase_id}>{p.food_name}</div>
      ))}
    </div>
  ),
}));

vi.mock("@mui/x-date-pickers", () => ({
  LocalizationProvider: ({ children }) => children,
}));

vi.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: class AdapterDayjs {},
}));

// Avoid @mui/x-date-pickers ESM resolution issues in Vitest; exercise FoodLog wiring.
vi.mock("../DateNavigator", () => ({
  default: ({ value, onChange }) => (
    <div>
      <div data-testid="selected-date">{dayjs(value).format("YYYY-MM-DD")}</div>
      <button
        type="button"
        aria-label="Previous day"
        onClick={() => onChange(dayjs(value).subtract(1, "day"))}
      >
        Prev
      </button>
      <button
        type="button"
        aria-label="Next day"
        onClick={() => onChange(dayjs(value).add(1, "day"))}
      >
        Next
      </button>
    </div>
  ),
}));

function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location">
      {location.pathname}
      {location.search}
    </div>
  );
}

function renderFoodLog(initialEntry = "/log", { tabActive = true } = {}) {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <TabVisibilityContext.Provider value={tabActive}>
          <Routes>
            <Route
              path="/log"
              element={
                <>
                  <LocationProbe />
                  <FoodLog />
                </>
              }
            />
          </Routes>
        </TabVisibilityContext.Provider>
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe("FoodLog date navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("lets the user move to a previous day without snapping back", async () => {
    const user = userEvent.setup();
    renderFoodLog("/log");

    const today = getAppToday().format("YYYY-MM-DD");
    expect(await screen.findByTestId("selected-date")).toHaveTextContent(today);

    await user.click(screen.getByRole("button", { name: "Previous day" }));

    const yesterday = getAppToday().subtract(1, "day").format("YYYY-MM-DD");
    await waitFor(() => {
      expect(screen.getByTestId("selected-date")).toHaveTextContent(yesterday);
    });

    // Stay on yesterday — the old URL-sync bug snapped back to today here.
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByTestId("selected-date")).toHaveTextContent(yesterday);
  });

  it("applies a Summary deep-link date once, then clears ?date=", async () => {
    const user = userEvent.setup();
    const deepLinkDate = "2026-09-10";
    renderFoodLog(`/log?date=${deepLinkDate}`);

    expect(await screen.findByTestId("selected-date")).toHaveTextContent(deepLinkDate);

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/log");
      expect(screen.getByTestId("location")).not.toHaveTextContent("date=");
    });

    await user.click(screen.getByRole("button", { name: "Previous day" }));

    const dayBefore = "2026-09-09";
    await waitFor(() => {
      expect(screen.getByTestId("selected-date")).toHaveTextContent(dayBefore);
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByTestId("selected-date")).toHaveTextContent(dayBefore);
  });

  it("ignores ?date= while the tab is inactive (keep-alive)", async () => {
    renderFoodLog("/log?date=2026-09-10", { tabActive: false });

    // Inactive FoodLog should not adopt or rewrite the URL.
    // Initial state still reads ?date= on mount (useState), which matches deep-link
    // landing. The keep-alive guard is: do not clear/write URL while inactive.
    expect(await screen.findByTestId("selected-date")).toHaveTextContent("2026-09-10");
    expect(screen.getByTestId("location")).toHaveTextContent("date=2026-09-10");
  });
});
