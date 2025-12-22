import { ClueMap } from '../maps/ClueMap.js';
import { AnswerMap } from '../maps/AnswerMap.js';
import { DataLoader } from '../data/DataLoader.js';
import { ScoreManager } from './ScoreManager.js';
import { Timer } from './Timer.js';
import { languageManager } from '../i18n/LanguageManager.js';

export class GameEngine {
  constructor(ui) {
    this.ui = ui;
    this.dataLoader = new DataLoader();
    this.scoreManager = new ScoreManager();
    this.timer = new Timer(30000);

    this.clueMap = null;
    this.answerMap = null;

    this.currentCountry = null;
    this.currentRound = 0;
    this.totalRounds = 10;
    this.isGameActive = false;
    this.usedCountries = new Set();
    this.selectedContinent = 'all';

    this.setupTimer();
  }

  goHome() {
    this.isGameActive = false;
    this.timer.stop();
    this.clueMap?.stopAnimation();
  }

  onLanguageChange(lang) {
    if (this.answerMap) {
      this.answerMap.setLanguage(lang);
    }
  }

  setupTimer() {
    this.timer.onTick = (remaining) => {
      this.ui.updateTimer(remaining);
    };

    this.timer.onComplete = () => {
      // Auto-submit when time runs out
      this.submitAnswer();
    };
  }

  async startGame(continent = 'all') {
    this.selectedContinent = continent;
    this.ui.showScreen('game');

    // Initialize maps if not already done
    if (!this.clueMap) {
      this.clueMap = new ClueMap('clue-map');
      this.answerMap = new AnswerMap('answer-map');

      this.answerMap.onCountrySelected = (code, name, latlng) => {
        // Get localized name if available
        const countryData = code ? this.dataLoader.getCountryByCode(code) : null;
        const localizedName = countryData
          ? languageManager.getCountryName(countryData.name)
          : name;
        this.ui.setSelectedCountry(localizedName);
      };
    }

    // Load data if not already loaded
    try {
      const { geojson, countries } = await this.dataLoader.load();
      this.answerMap.setGeoJSON(geojson);
      this.clueMap.setGeoJSON(geojson, countries);
    } catch (error) {
      console.error('Failed to load game data:', error);
      alert('Failed to load game data. Please refresh the page.');
      return;
    }

    // Reset game state
    this.scoreManager.reset();
    this.currentRound = 0;
    this.usedCountries.clear();
    this.isGameActive = true;

    this.ui.updateScore(0);

    // Ensure maps are properly sized
    setTimeout(() => {
      this.clueMap.invalidateSize();
      this.answerMap.invalidateSize();
      this.nextRound();
    }, 100);
  }

  nextRound() {
    this.ui.hideResult();

    this.currentRound++;

    if (this.currentRound > this.totalRounds) {
      this.endGame();
      return;
    }

    // Get a random country not yet used
    this.currentCountry = this.getUniqueRandomCountry();

    if (!this.currentCountry) {
      console.error('No more countries available');
      this.endGame();
      return;
    }

    this.usedCountries.add(this.currentCountry.code);

    // Update UI
    this.ui.updateRound(this.currentRound, this.totalRounds);
    this.ui.setFlag(this.currentCountry.flag);
    this.ui.setSelectedCountry(null);
    this.ui.updateNextRoundButton(this.currentRound === this.totalRounds);

    // Reset maps
    this.clueMap.reset();
    this.answerMap.reset();

    // Set target and start elimination animation
    this.clueMap.setTarget(this.currentCountry.code, this.currentCountry.continent);
    this.clueMap.startAnimation(30000);

    // Start timer
    this.timer.reset();
    this.timer.start();
  }

  getUniqueRandomCountry() {
    const countries = this.dataLoader.getCountryList();

    // Determine max difficulty based on current round
    // Rounds 1-3: Easy only (difficulty 1)
    // Rounds 4-6: Easy + Medium (difficulty 1-2)
    // Rounds 7-10: All difficulties (1-3)
    let maxDifficulty;
    if (this.currentRound <= 3) {
      maxDifficulty = 1;
    } else if (this.currentRound <= 6) {
      maxDifficulty = 2;
    } else {
      maxDifficulty = 3;
    }

    // Filter by continent (if selected), difficulty, and not yet used
    let available = countries.filter(c => {
      if (this.usedCountries.has(c.code)) return false;
      if (this.selectedContinent !== 'all' && c.continent !== this.selectedContinent) return false;
      if ((c.difficulty || 3) > maxDifficulty) return false;
      return true;
    });

    // Fallback: relax difficulty requirement
    if (available.length === 0) {
      available = countries.filter(c => {
        if (this.usedCountries.has(c.code)) return false;
        if (this.selectedContinent !== 'all' && c.continent !== this.selectedContinent) return false;
        return true;
      });
    }

    // Final fallback: any unused country
    if (available.length === 0) {
      available = countries.filter(c => !this.usedCountries.has(c.code));
    }

    if (available.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }

  submitAnswer() {
    if (!this.isGameActive) return;

    // Stop animations and timer
    this.timer.stop();
    this.clueMap.stopAnimation();

    const { countryCode, latlng } = this.answerMap.getSelectedCountry();
    const isCorrect = countryCode === this.currentCountry.code;

    // Calculate distance to capital
    let distanceToCapital = Infinity;
    if (latlng && this.currentCountry.capitalCoords) {
      distanceToCapital = this.answerMap.getDistanceToCapital(this.currentCountry.capitalCoords);
    }

    // Calculate score
    const score = this.scoreManager.calculateRoundScore({
      isCorrect,
      timeElapsed: this.timer.getElapsed(),
      zoomProgress: this.clueMap.getCurrentProgress(),
      distanceToCapital
    });

    // Get localized country names
    const targetName = languageManager.getCountryName(this.currentCountry.name);
    const guessedCountryData = countryCode ? this.dataLoader.getCountryByCode(countryCode) : null;
    const guessedCountryName = guessedCountryData
      ? languageManager.getCountryName(guessedCountryData.name)
      : languageManager.t('noAnswer');

    this.scoreManager.addRoundScore(score, isCorrect, {
      targetCode: this.currentCountry.code,
      targetName: targetName,
      targetFlag: this.currentCountry.flag,
      guessedCode: countryCode,
      guessedName: guessedCountryName
    });

    // Update UI
    this.ui.updateScore(this.scoreManager.getTotalScore());

    // Show correct country on both maps
    this.answerMap.showCorrectCountry(this.currentCountry.code);
    this.clueMap.showTarget();

    // Show result overlay
    this.ui.showResult(isCorrect, targetName, score);
  }

  endGame() {
    this.isGameActive = false;
    this.timer.stop();
    this.clueMap?.stopAnimation();

    this.ui.showEndScreen(
      this.scoreManager.getTotalScore(),
      this.scoreManager.getCorrectCount(),
      this.totalRounds,
      this.scoreManager.getRoundHistory()
    );
  }
}
