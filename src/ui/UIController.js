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
      hintBonus: document.getElementById('hint-bonus'),
      capitalBonus: document.getElementById('capital-bonus'),
      roundScore: document.getElementById('round-score'),
      nextRoundBtn: document.getElementById('next-round-btn'),
      finalScore: document.getElementById('final-score'),
      correctCount: document.getElementById('correct-count'),
      recapList: document.getElementById('recap-list'),
      // Country card elements
      countryCard: document.getElementById('country-card'),
      cardResultTitle: document.getElementById('card-result-title'),
      cardFlag: document.getElementById('card-flag'),
      cardCountryName: document.getElementById('card-country-name'),
      cardCapital: document.getElementById('card-capital'),
      cardContinent: document.getElementById('card-continent'),
      cardRegion: document.getElementById('card-region'),
      cardTimeBonus: document.getElementById('card-time-bonus'),
      cardHintBonus: document.getElementById('card-hint-bonus'),
      cardCapitalBonus: document.getElementById('card-capital-bonus'),
      cardRoundScore: document.getElementById('card-round-score'),
      cardNextBtn: document.getElementById('card-next-btn'),
      // Candidates panel elements
      candidatesPanel: document.getElementById('candidates-panel'),
      candidatesList: document.querySelector('.candidates-list')
    };

    // Apply initial translations and language selector state
    this.applyTranslations();
  }

  showCandidatesPanel(candidates, onSelect) {
    this.elements.candidatesList.innerHTML = '';

    candidates.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'candidate-btn';
      btn.dataset.code = c.code;
      // Show country shape silhouette and name (no flag to avoid giving away answer)
      const svgHtml = c.svg || '';
      btn.innerHTML = `
        <div class="candidate-shape">${svgHtml}</div>
        <span>${languageManager.getCountryName(c.name)}</span>
      `;
      btn.addEventListener('click', () => onSelect(c.code));
      this.elements.candidatesList.appendChild(btn);
    });

    this.elements.candidatesPanel.classList.remove('hidden');
  }

  hideCandidatesPanel() {
    if (this.elements.candidatesPanel) {
      this.elements.candidatesPanel.classList.add('hidden');
    }
  }

  eliminateCandidate(code) {
    const btn = this.elements.candidatesList?.querySelector(`[data-code="${code}"]`);
    if (btn) btn.classList.add('eliminated');
  }

  highlightSelectedCandidate(code) {
    this.elements.candidatesList?.querySelectorAll('.candidate-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.code === code);
    });
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
    this.elements.hintBonus.textContent = `+${score.hintBonus}`;
    this.elements.capitalBonus.textContent = `+${score.capitalBonus}`;
    this.elements.roundScore.textContent = score.total;

    this.resultOverlay.classList.remove('hidden');
  }

  hideResult() {
    this.resultOverlay.classList.add('hidden');
  }

  showCountryCard(countryData, isCorrect, score, isLastRound) {
    // Result title
    const title = this.elements.cardResultTitle;
    title.textContent = isCorrect ? languageManager.t('correct') : languageManager.t('wrong');
    title.className = 'card-result-title ' + (isCorrect ? 'correct' : 'incorrect');

    // Country info
    this.elements.cardFlag.src = countryData.flag;
    this.elements.cardCountryName.textContent = countryData.name;
    this.elements.cardCapital.textContent = countryData.capital || '-';
    this.elements.cardContinent.textContent = countryData.continent;
    this.elements.cardRegion.textContent = countryData.subregion || '-';

    // Score breakdown
    this.elements.cardTimeBonus.textContent = `+${score.timeBonus}`;
    this.elements.cardHintBonus.textContent = `+${score.hintBonus}`;
    this.elements.cardCapitalBonus.textContent = `+${score.capitalBonus}`;
    this.elements.cardRoundScore.textContent = score.total;

    // Next button text
    this.elements.cardNextBtn.textContent = isLastRound
      ? languageManager.t('seeResults')
      : languageManager.t('nextRound');

    this.elements.countryCard.classList.remove('hidden');
  }

  hideCountryCard() {
    this.elements.countryCard.classList.add('hidden');
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
