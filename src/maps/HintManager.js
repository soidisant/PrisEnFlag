/**
 * Manages progressive hint system
 * Three hint levels: continent zoom, candidates highlight, elimination
 */
export class HintManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.hintStates = {
      continentZoomed: false,
      candidatesHighlighted: false,
      eliminationStarted: false
    };
    this.eliminatedCount = 0;
    this.totalCandidates = 0;
  }

  /**
   * Set total number of candidates for elimination tracking
   */
  setTotalCandidates(count) {
    this.totalCandidates = count;
  }

  /**
   * Mark continent zoom hint as shown
   */
  markContinentZoomed() {
    this.hintStates.continentZoomed = true;
  }

  /**
   * Mark candidates highlight hint as shown
   */
  markCandidatesHighlighted() {
    this.hintStates.candidatesHighlighted = true;
  }

  /**
   * Mark elimination as started
   */
  markEliminationStarted() {
    this.hintStates.eliminationStarted = true;
  }

  /**
   * Increment eliminated count
   */
  incrementEliminated() {
    this.eliminatedCount++;
  }

  /**
   * Get which hint should be shown next
   * Returns: 'continent', 'candidates', 'elimination', or null if all shown
   */
  getNextHint() {
    if (!this.hintStates.continentZoomed) {
      return 'continent';
    }
    if (!this.hintStates.candidatesHighlighted) {
      return 'candidates';
    }
    if (!this.hintStates.eliminationStarted) {
      return 'elimination';
    }
    // Continue eliminating if there are more candidates
    if (this.totalCandidates > 0 && this.eliminatedCount < this.totalCandidates - 1) {
      return 'elimination';
    }
    return null;
  }

  /**
   * Check if more hints are available
   */
  hasMoreHints() {
    return this.getNextHint() !== null;
  }

  /**
   * Get hint progress for scoring (0 = no hints, 1 = all hints shown)
   */
  getHintProgress() {
    let progress = 0;
    const weights = {
      continent: 0.2,      // 20% of hint progress
      candidates: 0.3,     // 30% of hint progress
      elimination: 0.5     // 50% of hint progress (proportional to eliminated)
    };

    if (this.hintStates.continentZoomed) {
      progress += weights.continent;
    }

    if (this.hintStates.candidatesHighlighted) {
      progress += weights.candidates;
    }

    if (this.hintStates.eliminationStarted && this.totalCandidates > 1) {
      // Elimination progress is proportional to how many were eliminated
      const maxEliminations = this.totalCandidates - 1;
      const eliminationProgress = this.eliminatedCount / maxEliminations;
      progress += weights.elimination * eliminationProgress;
    }

    return Math.min(1, progress);
  }

  /**
   * Check if continent hint was shown
   */
  isContinentZoomed() {
    return this.hintStates.continentZoomed;
  }

  /**
   * Check if candidates hint was shown
   */
  areCandidatesHighlighted() {
    return this.hintStates.candidatesHighlighted;
  }

  /**
   * Check if elimination started
   */
  isEliminationStarted() {
    return this.hintStates.eliminationStarted;
  }

  /**
   * Get number of eliminated candidates
   */
  getEliminatedCount() {
    return this.eliminatedCount;
  }
}
