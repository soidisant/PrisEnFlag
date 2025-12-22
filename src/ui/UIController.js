import { languageManager } from '../i18n/LanguageManager.js';

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

    // Apply initial translations and language selector state
    this.applyTranslations();
  }

  applyTranslations() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = languageManager.t(key);
    });

    // Update language selector active state
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === languageManager.lang);
    });
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
      this.elements.selectedInfo.textContent = `${languageManager.t('selected')}: ${countryName}`;
      this.elements.submitBtn.disabled = false;
    } else {
      this.elements.selectedInfo.textContent = languageManager.t('selectCountry');
      this.elements.submitBtn.disabled = true;
    }
  }

  showResult(isCorrect, countryName, score) {
    const title = this.elements.resultTitle;
    title.textContent = isCorrect ? languageManager.t('correct') : languageManager.t('wrong');
    title.className = isCorrect ? 'correct' : 'incorrect';

    this.elements.resultCountry.textContent = `${languageManager.t('answerWas')}: ${countryName}`;
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
    this.elements.nextRoundBtn.textContent = isLastRound
      ? languageManager.t('seeResults')
      : languageManager.t('nextRound');
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
        ? languageManager.t('correct')
        : `${languageManager.t('guessed')}: ${round.guessedName}`;

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
