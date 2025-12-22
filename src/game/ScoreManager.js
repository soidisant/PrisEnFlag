export class ScoreManager {
  constructor() {
    this.totalScore = 0;
    this.roundScores = [];
    this.roundHistory = [];  // Full history for recap
    this.correctCount = 0;

    // Scoring constants
    this.MAX_TIME_BONUS = 1000;
    this.MAX_HINT_BONUS = 500;
    this.CAPITAL_BONUS = 200;
    this.CAPITAL_THRESHOLD_KM = 50;
    this.ROUND_DURATION = 30000; // 30 seconds
  }

  calculateRoundScore({ isCorrect, timeElapsed, hintProgress, distanceToCapital, usedPanel = false }) {
    if (!isCorrect) {
      return {
        timeBonus: 0,
        hintBonus: 0,
        capitalBonus: 0,
        panelPenalty: 0,
        total: 0
      };
    }

    // Time bonus: 1000 max, linear decrease over 30s
    let timeBonus = Math.max(
      0,
      Math.round(this.MAX_TIME_BONUS * (1 - timeElapsed / this.ROUND_DURATION))
    );

    // Hint bonus: 500 max if answered with fewer hints shown
    let hintBonus = Math.max(
      0,
      Math.round(this.MAX_HINT_BONUS * (1 - hintProgress))
    );

    // Capital bonus: 200 if within 50km of capital
    // Not available when using panel (since it places marker at center)
    const capitalBonus = (!usedPanel && distanceToCapital <= this.CAPITAL_THRESHOLD_KM * 1000)
      ? this.CAPITAL_BONUS
      : 0;

    // Panel penalty: reduce time and hint bonus by 50% when using panel
    let panelPenalty = 0;
    if (usedPanel) {
      panelPenalty = Math.round((timeBonus + hintBonus) * 0.5);
      timeBonus = Math.round(timeBonus * 0.5);
      hintBonus = Math.round(hintBonus * 0.5);
    }

    const total = timeBonus + hintBonus + capitalBonus;

    return {
      timeBonus,
      hintBonus,
      capitalBonus,
      panelPenalty,
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
