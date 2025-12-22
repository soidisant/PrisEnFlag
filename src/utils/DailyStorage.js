/**
 * localStorage helpers for Daily Challenge mode.
 */

const STORAGE_KEY = 'pris-en-flag-daily';
const MAX_HISTORY_DAYS = 7;

/**
 * Get all daily challenge data from localStorage.
 */
export function getDailyData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { results: {} };
  } catch {
    return { results: {} };
  }
}

/**
 * Save a daily result to localStorage.
 */
export function saveDailyResult(dateString, result) {
  const data = getDailyData();
  data.lastPlayed = dateString;
  data.results[dateString] = result;

  // Prune old results (keep last 7 days)
  const dates = Object.keys(data.results).sort().reverse();
  if (dates.length > MAX_HISTORY_DAYS) {
    dates.slice(MAX_HISTORY_DAYS).forEach(d => delete data.results[d]);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable - ignore
  }
}

/**
 * Check if the daily challenge has been completed for a given date.
 */
export function hasCompletedToday(dateString) {
  const data = getDailyData();
  return data.results[dateString]?.completed === true;
}

/**
 * Get the result for a specific date, or null if not played.
 */
export function getTodayResult(dateString) {
  const data = getDailyData();
  return data.results[dateString] || null;
}
