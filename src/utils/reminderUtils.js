import moment from "moment-timezone";

const TZ = "America/New_York";

/** App-local calendar day — matches server daily_tasks.task_date. */
export function getReminderDayKey() {
  return moment.tz(TZ).format("YYYY-MM-DD");
}

export function getDailyTasksPopupKey(userId) {
  return `dailyTasksPopup_${userId}_${getReminderDayKey()}`;
}

export function markDailyTasksPopupSeen(userId) {
  if (!userId) return;
  localStorage.setItem(getDailyTasksPopupKey(userId), "true");
}

export function wasDailyTasksPopupSeenToday(userId, serverPopupShown = false) {
  if (!userId) return true;
  if (serverPopupShown) return true;
  return localStorage.getItem(getDailyTasksPopupKey(userId)) === "true";
}

export function countCompletedDailyTasks(tasks) {
  if (!tasks) return 0;
  let count = 0;
  if (tasks.log_food_completed) count++;
  if (tasks.complete_survey_completed) count++;
  if (tasks.log_consume_waste_completed) count++;
  return count;
}

export function hasIncompleteDailyTasks(tasks) {
  return countCompletedDailyTasks(tasks) < 3;
}

/**
 * Daily tasks popup: after initial survey, skip when weekly survey is due,
 * and only once per day unless user still has open tasks after navigating away.
 */
export function shouldOfferDailyTasksPopup({
  userId,
  surveyStatus,
  tasks,
  surveyReminderBlocking = false,
}) {
  if (!userId || !tasks) return false;
  if (surveyReminderBlocking) return false;
  if (!surveyStatus?.initialCompleted) return false;
  if (surveyStatus?.weeklyDue) return false;
  if (!hasIncompleteDailyTasks(tasks)) return false;
  if (wasDailyTasksPopupSeenToday(userId, tasks.popup_shown_today)) return false;
  return true;
}

export function getWeeklySurveyModalKey() {
  return `weeklyModalShown_${getReminderDayKey()}`;
}

const WEEKLY_SURVEY_SNOOZE_KEY = "weeklySurveySnoozedAt";

export function markWeeklySurveyModalShown() {
  localStorage.setItem(getWeeklySurveyModalKey(), "true");
}

export function wasWeeklySurveyModalShownToday() {
  return localStorage.getItem(getWeeklySurveyModalKey()) === "true";
}

/** Secret snooze — stores timestamp; hides forced weekly modal for the rest of today. */
export function markWeeklySurveySnoozed() {
  localStorage.setItem(WEEKLY_SURVEY_SNOOZE_KEY, String(Date.now()));
  markWeeklySurveyModalShown();
}

export function isWeeklySurveySnoozedToday() {
  const raw = localStorage.getItem(WEEKLY_SURVEY_SNOOZE_KEY);
  if (!raw) return false;
  const ts = Number.parseInt(raw, 10);
  if (Number.isNaN(ts)) return false;
  return moment.tz(ts, TZ).format("YYYY-MM-DD") === getReminderDayKey();
}

export function isWeeklySurveyForced(surveyStatus) {
  const days = surveyStatus?.daysSinceLastWeekly;
  return days === null || days > 9;
}

export function shouldOfferWeeklySurveyModal(surveyStatus, pathname, isPublicPage) {
  if (!surveyStatus?.initialCompleted || !surveyStatus?.weeklyDue) return false;
  if (isPublicPage(pathname)) return false;
  if (isWeeklySurveySnoozedToday()) return false;
  if (isWeeklySurveyForced(surveyStatus)) return true;
  return !wasWeeklySurveyModalShownToday();
}

export function shouldOfferInitialSurveyModal(surveyStatus, pathname, isPublicPage) {
  if (surveyStatus?.initialCompleted) return false;
  if (isPublicPage(pathname)) return false;
  return localStorage.getItem("surveyModalShown") !== "true";
}

export function markInitialSurveyModalShown() {
  localStorage.setItem("surveyModalShown", "true");
}

export const SURVEY_REMINDER_OPEN = "surveyReminderOpen";
export const SURVEY_REMINDER_CLOSE = "surveyReminderClose";

export function notifySurveyReminderOpen() {
  window.dispatchEvent(new CustomEvent(SURVEY_REMINDER_OPEN));
}

export function notifySurveyReminderClose() {
  window.dispatchEvent(new CustomEvent(SURVEY_REMINDER_CLOSE));
}
