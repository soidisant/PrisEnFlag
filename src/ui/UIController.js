export class UIController {
  constructor() {
    this.screens = {
      start: document.getElementById('start-screen'),
      game: document.getElementById('game-screen'),
      end: document.getElementById('end-screen')
    };
    this.resultOverlay = document.getElementById('result-overlay');

    this.elements = {
      totalScore: document.getElementById('total-score'),
      currentRound: document.getElementById('current-round'),
      totalRounds: document.getElementById('total-rounds'),
      timer: document.getElementById('timer'),
      flagImage: document.getElementById('flag-image'),
      selectedInfo: document.getElementById('selected-info'),
      submitBtn: document.getElementById('submit-btn'),
      resultTitle: document.getElementById('result-title'),
      resultCountry: document.getElementById('result-country'),
      timeBonus: document.getElementById('time-bonus'),
      zoomBonus: document.getElementById('zoom-bonus'),
      capitalBonus: document.getElementById('capital-bonus'),
      roundScore: document.getElementById('round-score'),
      nextRoundBtn: document.getElementById('next-round-btn'),
      finalScore: document.getElementById('final-score'),
      correctCount: document.getElementById('correct-count'),
      recapList: document.getElementById('recap-list')
    };
  }

  showScreen(screenName) {
    Object.values(this.screens).forEach(screen => {
      screen.classList.add('hidden');
    });
    if (this.screens[screenName]) {
      this.screens[screenName].classList.remove('hidden');
    }
  }

  updateScore(score) {
    this.elements.totalScore.textContent = score;
  }

  updateRound(current, total) {
    this.elements.currentRound.textContent = current;
    this.elements.totalRounds.textContent = total;
  }

  updateTimer(remainingMs) {
    const seconds = Math.max(0, remainingMs / 1000).toFixed(1);
    this.elements.timer.textContent = seconds;
  }

  setFlag(flagUrl) {
    this.elements.flagImage.src = flagUrl;
  }

  setSelectedCountry(countryName) {
    if (countryName) {
      this.elements.selectedInfo.textContent = `Selected: ${countryName}`;
      this.elements.submitBtn.disabled = false;
    } else {
      this.elements.selectedInfo.textContent = 'Click on the map to place your guess';
      this.elements.submitBtn.disabled = true;
    }
  }

  showResult(isCorrect, countryName, score) {
    const title = this.elements.resultTitle;
    title.textContent = isCorrect ? 'Correct!' : 'Wrong!';
    title.className = isCorrect ? 'correct' : 'incorrect';

    this.elements.resultCountry.textContent = `The answer was: ${countryName}`;
    this.elements.timeBonus.textContent = `+${score.timeBonus}`;
    this.elements.zoomBonus.textContent = `+${score.zoomBonus}`;
    this.elements.capitalBonus.textContent = `+${score.capitalBonus}`;
    this.elements.roundScore.textContent = score.total;

    this.resultOverlay.classList.remove('hidden');
  }

  hideResult() {
    this.resultOverlay.classList.add('hidden');
  }

  updateNextRoundButton(isLastRound) {
    this.elements.nextRoundBtn.textContent = isLastRound ? 'See Results' : 'Next Round';
  }

  showEndScreen(totalScore, correctCount, totalRounds, roundHistory = []) {
    this.elements.finalScore.textContent = totalScore;
    this.elements.correctCount.textContent = correctCount;

    // Render round recap
    this.renderRecap(roundHistory);

    this.showScreen('end');
  }

  renderRecap(roundHistory) {
    const recapList = this.elements.recapList;
    recapList.innerHTML = '';

    roundHistory.forEach((round, index) => {
      const item = document.createElement('div');
      item.className = `recap-item ${round.isCorrect ? 'correct' : 'incorrect'}`;

      const guessText = round.isCorrect
        ? 'Correct!'
        : `Guessed: ${round.guessedName}`;

      item.innerHTML = `
        <img src="${round.targetFlag}" alt="${round.targetName}" class="recap-flag" />
        <div class="recap-info">
          <div class="recap-target">${round.targetName}</div>
          <div class="recap-guess ${round.isCorrect ? '' : 'wrong'}">${guessText}</div>
        </div>
        <div class="recap-score">+${round.score}</div>
      `;

      recapList.appendChild(item);
    });
  }

  enableSubmit() {
    this.elements.submitBtn.disabled = false;
  }

  disableSubmit() {
    this.elements.submitBtn.disabled = true;
  }
}
