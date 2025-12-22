export class ScoreManager {
  constructor() {
    this.totalScore = 0;
    this.roundScores = [];
    this.roundHistory = [];  // Full history for recap
    this.correctCount = 0;

    // Scoring constants
    this.MAX_TIME_BONUS = 1000;
    this.MAX_ZOOM_BONUS = 500;
    this.CAPITAL_BONUS = 200;
    this.CAPITAL_THRESHOLD_KM = 50;
    this.ROUND_DURATION = 30000; // 30 seconds
  }

  calculateRoundScore({ isCorrect, timeElapsed, zoomProgress, distanceToCapital }) {
    if (!isCorrect) {
      return {
        timeBonus: 0,
        zoomBonus: 0,
        capitalBonus: 0,
        total: 0
      };
    }

    // Time bonus: 1000 max, linear decrease over 30s
    const timeBonus = Math.max(
      0,
      Math.round(this.MAX_TIME_BONUS * (1 - timeElapsed / this.ROUND_DURATION))
    );

    // Zoom bonus: 500 max if answered early (less map revealed)
    const zoomBonus = Math.max(
      0,
      Math.round(this.MAX_ZOOM_BONUS * (1 - zoomProgress))
    );

    // Capital bonus: 200 if within 50km of capital
    const capitalBonus = distanceToCapital <= this.CAPITAL_THRESHOLD_KM * 1000
      ? this.CAPITAL_BONUS
      : 0;

    const total = timeBonus + zoomBonus + capitalBonus;

    return {
      timeBonus,
      zoomBonus,
      capitalBonus,
      total
    };
  }

  addRoundScore(score, isCorrect, roundDetails = null) {
    this.roundScores.push(score);
    this.totalScore += score.total;
    if (isCorrect) {
      this.correctCount++;
    }

    // Store full round details for recap
    if (roundDetails) {
      this.roundHistory.push({
        ...roundDetails,
        isCorrect,
        score: score.total
      });
    }
  }

  getRoundHistory() {
    return this.roundHistory;
  }

  getTotalScore() {
    return this.totalScore;
  }

  getCorrectCount() {
    return this.correctCount;
  }

  getRoundScores() {
    return this.roundScores;
  }

  reset() {
    this.totalScore = 0;
    this.roundScores = [];
    this.roundHistory = [];
    this.correctCount = 0;
  }
}
