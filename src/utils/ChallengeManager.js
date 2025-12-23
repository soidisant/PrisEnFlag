import { SeededRandom } from './SeededRandom.js';

// Generate a short unique ID (8 characters)
export function generateChallengeId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// Convert challenge ID to numeric seed
export function challengeIdToSeed(challengeId) {
  let seed = 0;
  for (let i = 0; i < challengeId.length; i++) {
    seed = ((seed << 5) - seed) + challengeId.charCodeAt(i);
    seed = seed & seed; // Convert to 32-bit integer
  }
  return Math.abs(seed);
}

// Select countries for a challenge using the seed
export function selectChallengeCountries(countries, challengeId, continent = 'all', totalRounds = 10) {
  const seed = challengeIdToSeed(challengeId);
  const rng = new SeededRandom(seed);

  // Filter by continent if specified
  let available = countries;
  if (continent !== 'all') {
    available = countries.filter(c => c.continent === continent);
  }

  // Shuffle the available countries using seeded random
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Apply difficulty progression like daily challenge
  const selected = [];
  const used = new Set();

  for (let round = 1; round <= totalRounds; round++) {
    // Determine max difficulty based on round
    let maxDifficulty;
    if (round <= 3) {
      maxDifficulty = 1;
    } else if (round <= 6) {
      maxDifficulty = 2;
    } else {
      maxDifficulty = 3;
    }

    // Find a country matching the difficulty
    const candidate = shuffled.find(c => {
      if (used.has(c.code)) return false;
      if ((c.difficulty || 3) > maxDifficulty) return false;
      return true;
    });

    if (candidate) {
      selected.push(candidate);
      used.add(candidate.code);
    } else {
      // Fallback: pick any unused country
      const fallback = shuffled.find(c => !used.has(c.code));
      if (fallback) {
        selected.push(fallback);
        used.add(fallback.code);
      }
    }
  }

  return selected;
}

// Generate challenge URL
export function generateChallengeUrl(challengeId, continent = 'all') {
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();
  params.set('challenge', challengeId);
  if (continent !== 'all') {
    params.set('region', continent);
  }
  return `${baseUrl}?${params.toString()}`;
}

// Parse challenge from URL
export function parseChallengeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const challengeId = params.get('challenge');
  const continent = params.get('region') || 'all';

  if (challengeId) {
    return { challengeId, continent };
  }
  return null;
}

// Clear challenge from URL (after playing)
export function clearChallengeFromUrl() {
  const url = window.location.origin + window.location.pathname;
  window.history.replaceState({}, '', url);
}
