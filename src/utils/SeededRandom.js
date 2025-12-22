/**
 * Seeded pseudo-random number generator using Mulberry32 algorithm.
 * Produces deterministic random numbers given the same seed.
 */
export class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }

  /**
   * Generate next random number between 0 and 1
   */
  next() {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  /**
   * Generate random integer from 0 to max-1
   */
  nextInt(max) {
    return Math.floor(this.next() * max);
  }

  /**
   * Shuffle array in place using Fisher-Yates algorithm
   */
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
