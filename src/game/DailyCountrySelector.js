/**
 * Selects countries for Daily Challenge mode using seeded random.
 * Ensures all users get the same countries on the same day.
 */

import { SeededRandom } from '../utils/SeededRandom.js';
import { getDailyChallengeDate, dateToSeed } from '../utils/DailyChallenge.js';

export class DailyCountrySelector {
  constructor(countries) {
    this.countries = countries; // Array from DataLoader.getCountryList()
  }

  /**
   * Select 10 countries for today's daily challenge.
   * Uses the same difficulty progression as normal mode:
   * - Rounds 1-3: difficulty 1 only
   * - Rounds 4-6: difficulty 1-2
   * - Rounds 7-10: all difficulties
   */
  selectDailyCountries() {
    const dateString = getDailyChallengeDate();
    const seed = dateToSeed(dateString);
    const rng = new SeededRandom(seed);

    const selected = [];
    const used = new Set();

    // Round distribution matching normal mode
    const roundDifficulties = [
      1, 1, 1,       // Rounds 1-3: difficulty 1 only
      2, 2, 2,       // Rounds 4-6: difficulty 1-2
      3, 3, 3, 3     // Rounds 7-10: all difficulties
    ];

    for (let round = 0; round < 10; round++) {
      const maxDifficulty = roundDifficulties[round];

      // Filter available countries by difficulty and not yet used
      let available = this.countries.filter(c => {
        if (used.has(c.code)) return false;
        if ((c.difficulty || 3) > maxDifficulty) return false;
        return true;
      });

      // Fallback: any unused country if no countries match difficulty
      if (available.length === 0) {
        available = this.countries.filter(c => !used.has(c.code));
      }

      if (available.length === 0) break;

      // Deterministic random selection
      const index = rng.nextInt(available.length);
      const country = available[index];
      selected.push(country);
      used.add(country.code);
    }

    return {
      date: dateString,
      countries: selected
    };
  }
}
