import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const getSurveyStatus = vi.fn();
const getTodayTasks = vi.fn();
const getStreak = vi.fn();
const getCurrentUserId = vi.fn(() => "42");

vi.mock("../api", () => ({
  surveyAPI: {
    getSurveyStatus: (...args) => getSurveyStatus(...args),
  },
  dailyTasksAPI: {
    getTodayTasks: (...args) => getTodayTasks(...args),
    getStreak: (...args) => getStreak(...args),
  },
}));

vi.mock("./authUtils", () => ({
  getCurrentUserId: () => getCurrentUserId(),
}));

describe("sessionDataCache race", () => {
  beforeEach(() => {
    vi.resetModules();
    getCurrentUserId.mockReturnValue("42");
    getSurveyStatus.mockReset();
    getTodayTasks.mockReset();
    getStreak.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not let a superseded fetch overwrite fresher cache", async () => {
    let resolveSlow;
    const slowSurvey = new Promise((resolve) => {
      resolveSlow = resolve;
    });

    getSurveyStatus
      .mockImplementationOnce(() => slowSurvey)
      .mockImplementationOnce(async () => ({
        data: { weeklyDue: false, initialCompleted: true },
      }));
    getTodayTasks.mockResolvedValue({ data: [] });
    getStreak.mockResolvedValue({ data: {} });

    const cache = await import("./sessionDataCache.js");

    const slowPromise = cache.fetchSessionData(true);

    cache.clearSessionDataCache();
    const fresh = await cache.fetchSessionData(true);

    expect(fresh.surveyStatus.weeklyDue).toBe(false);

    resolveSlow({ data: { weeklyDue: true, initialCompleted: true } });
    await slowPromise;

    expect(cache.getSessionDataSnapshot().surveyStatus.weeklyDue).toBe(false);
  });
});
