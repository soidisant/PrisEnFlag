/**
 * Daily challenge date and seed utilities.
 * Handles Paris timezone (Europe/Paris) with 9AM reset.
 */

/**
 * Get the current daily challenge date string (YYYY-MM-DD).
 * Resets at 9:00 AM Paris time.
 */
export function getDailyChallengeDate() {
  const now = new Date();

  // Get current time in Paris timezone
  const parisFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false
  });

  const parts = parisFormatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year').value);
  const month = parseInt(parts.find(p => p.type === 'month').value);
  const day = parseInt(parts.find(p => p.type === 'day').value);
  const hour = parseInt(parts.find(p => p.type === 'hour').value);

  // If before 9AM Paris time, use previous day
  let challengeDay = day;
  let challengeMonth = month;
  let challengeYear = year;

  if (hour < 9) {
    // Go back one day
    const yesterday = new Date(Date.UTC(year, month - 1, day - 1));
    challengeDay = yesterday.getUTCDate();
    challengeMonth = yesterday.getUTCMonth() + 1;
    challengeYear = yesterday.getUTCFullYear();
  }

  // Return as YYYY-MM-DD string
  return `${challengeYear}-${String(challengeMonth).padStart(2, '0')}-${String(challengeDay).padStart(2, '0')}`;
}

/**
 * Convert a date string to a numeric seed for the PRNG.
 */
export function dateToSeed(dateString) {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
