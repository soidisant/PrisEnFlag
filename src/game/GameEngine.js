import { UnifiedMap } from '../maps/UnifiedMap.js';
import { DataLoader } from '../data/DataLoader.js';
import { ScoreManager } from './ScoreManager.js';
import { Timer } from './Timer.js';
import { languageManager } from '../i18n/LanguageManager.js';
import { DailyCountrySelector } from './DailyCountrySelector.js';
import { getDailyChallengeDate } from '../utils/DailyChallenge.js';
import { hasCompletedToday, getTodayResult, saveDailyResult } from '../utils/DailyStorage.js';

export class GameEngine {
  constructor(ui) {
    this.ui = ui;
    this.dataLoader = new DataLoader();
    this.scoreManager = new ScoreManager();
    this.timer = new Timer(30000);

    this.unifiedMap = null;

    this.currentCountry = null;
    this.currentRound = 0;
    this.totalRounds = 10;
    this.isGameActive = false;
    this.usedCountries = new Set();
    this.selectedContinent = 'all';

    // Daily mode properties
    this.isDailyMode = false;
    this.dailyCountries = null;
    this.dailyDate = null;

    this.setupTimer();
  }

  goHome() {
    this.isGameActive = false;
    this.timer.stop();
    this.unifiedMap?.stopRound();
  }

  onLanguageChange(lang) {
    if (this.unifiedMap) {
      this.unifiedMap.setLanguage(lang);
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

    // Initialize unified map if not already done
    if (!this.unifiedMap) {
      this.unifiedMap = new UnifiedMap('unified-map');

      this.unifiedMap.onCountrySelected = (code, name, latlng) => {
        // Get localized name if available
        const countryData = code ? this.dataLoader.getCountryByCode(code) : null;
        const localizedName = countryData
          ? languageManager.getCountryName(countryData.name)
          : name;
        this.ui.setSelectedCountry(localizedName);
        this.ui.highlightSelectedCandidate(code);
      };

      this.unifiedMap.onCandidatesRevealed = (candidates) => {
        this.ui.showCandidatesPanel(candidates, (code) => {
          this.unifiedMap.selectCandidateByCode(code);
        });
      };

      this.unifiedMap.onCandidateEliminated = (code) => {
        this.ui.eliminateCandidate(code);
      };

      // Apply saved hints preference
      const savedHints = localStorage.getItem('pris-en-flag-hints');
      if (savedHints === 'false') {
        this.unifiedMap.setHintsEnabled(false);
      }
    }

    // Load data if not already loaded
    try {
      const { geojson, countries } = await this.dataLoader.load();
      this.unifiedMap.setGeoJSON(geojson, countries);
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

    // Ensure map is properly sized
    setTimeout(() => {
      this.unifiedMap.invalidateSize();
      this.nextRound();
    }, 100);
  }

  async startDailyGame() {
    const dateString = getDailyChallengeDate();

    // Check if already completed today
    if (hasCompletedToday(dateString)) {
      const result = getTodayResult(dateString);
      this.ui.showDailyAlreadyCompleted(result, dateString);
      return;
    }

    // Load data first if not loaded
    try {
      await this.dataLoader.load();
    } catch (error) {
      console.error('Failed to load game data:', error);
      alert('Failed to load game data. Please refresh the page.');
      return;
    }

    // Pre-select countries for daily challenge
    const selector = new DailyCountrySelector(this.dataLoader.getCountryList());
    const { date, countries } = selector.selectDailyCountries();

    this.isDailyMode = true;
    this.dailyCountries = countries;
    this.dailyDate = date;

    // Start game with 'all' continent (daily mode is always world)
    await this.startGame('all');
  }

  nextRound() {
    this.ui.hideResult();
    this.ui.hideCountryCard();
    this.ui.hideCandidatesPanel();

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

    // Set target and start round on unified map
    this.unifiedMap.setTarget(this.currentCountry.code, this.currentCountry.continent);
    this.unifiedMap.startRound();

    // Start timer
    this.timer.reset();
    this.timer.start();
  }

  getUniqueRandomCountry() {
    // For daily mode, use pre-selected countries
    if (this.isDailyMode && this.dailyCountries) {
      return this.dailyCountries[this.currentRound - 1] || null;
    }

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

    // Stop timer and round
    this.timer.stop();
    this.unifiedMap.stopRound();
    this.ui.hideCandidatesPanel();

    const { countryCode, latlng, viaPanel } = this.unifiedMap.getSelectedCountry();
    const isCorrect = countryCode === this.currentCountry.code;

    // Calculate distance to capital
    let distanceToCapital = Infinity;
    if (latlng && this.currentCountry.capitalCoords) {
      distanceToCapital = this.unifiedMap.getDistanceToCapital(this.currentCountry.capitalCoords);
    }

    // Calculate score with hint progress instead of zoom progress
    // Panel selection gives reduced score
    const score = this.scoreManager.calculateRoundScore({
      isCorrect,
      timeElapsed: this.timer.getElapsed(),
      hintProgress: this.unifiedMap.getHintProgress(),
      distanceToCapital,
      usedPanel: viaPanel
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

    // Show correct country and zoom in
    this.unifiedMap.showTarget();
    this.unifiedMap.focusOnTarget();

    // Show country card with result
    const isLastRound = this.currentRound === this.totalRounds;
    this.ui.showCountryCard({
      flag: this.currentCountry.flag,
      name: targetName,
      capital: this.currentCountry.capital,
      continent: this.currentCountry.continent,
      subregion: this.currentCountry.subregion
    }, isCorrect, score, isLastRound);
  }

  endGame() {
    this.isGameActive = false;
    this.timer.stop();
    this.unifiedMap?.stopRound();

    // Save daily result if in daily mode
    if (this.isDailyMode && this.dailyDate) {
      saveDailyResult(this.dailyDate, {
        completed: true,
        score: this.scoreManager.getTotalScore(),
        correctCount: this.scoreManager.getCorrectCount(),
        roundHistory: this.scoreManager.getRoundHistory()
      });
    }

    this.ui.showEndScreen(
      this.scoreManager.getTotalScore(),
      this.scoreManager.getCorrectCount(),
      this.totalRounds,
      this.scoreManager.getRoundHistory(),
      this.isDailyMode
    );

    // Reset daily mode state
    this.isDailyMode = false;
    this.dailyCountries = null;
    this.dailyDate = null;
  }
}
