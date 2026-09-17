import moment from "moment-timezone";
import dayjs from "dayjs";

export const APP_TZ = "America/New_York";

/** App calendar day (YYYY-MM-DD) in America/New_York — matches server task/survey dates. */
export function getAppTodayKey() {
  return moment.tz(APP_TZ).format("YYYY-MM-DD");
}

/** dayjs for the app calendar today, for day-level comparisons. */
export function getAppToday() {
  return dayjs(getAppTodayKey());
}

/** True when both values fall in the same ISO week in America/New_York. */
export function isSameAppIsoWeek(dateA, dateB = getAppTodayKey()) {
  if (!dateA || !dateB) return false;
  const left = moment.tz(String(dateA).slice(0, 10), "YYYY-MM-DD", APP_TZ);
  const right = moment.tz(String(dateB).slice(0, 10), "YYYY-MM-DD", APP_TZ);
  if (!left.isValid() || !right.isValid()) return false;
  return left.isoWeek() === right.isoWeek() && left.isoWeekYear() === right.isoWeekYear();
}
