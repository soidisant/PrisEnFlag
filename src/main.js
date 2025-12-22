import './styles/main.css';
import { GameEngine } from './game/GameEngine.js';
import { UIController } from './ui/UIController.js';
import { languageManager } from './i18n/LanguageManager.js';

const ui = new UIController();
const game = new GameEngine(ui);

// Track selected continent
let selectedContinent = 'all';

// Language selector
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.lang;
    languageManager.setLanguage(lang);
  });
});

// Listen for language changes
languageManager.onChange((lang) => {
  ui.applyTranslations();
  game.onLanguageChange(lang);
});

// Continent selector
document.querySelectorAll('.continent-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.continent-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedContinent = btn.dataset.continent;
  });
});

// Start button
document.getElementById('start-btn').addEventListener('click', () => {
  game.startGame(selectedContinent);
});

// Submit answer button
document.getElementById('submit-btn').addEventListener('click', () => {
  game.submitAnswer();
});

// Next round button (in overlay - kept for backwards compatibility)
document.getElementById('next-round-btn').addEventListener('click', () => {
  game.nextRound();
});

// Next round button (in country card)
document.getElementById('card-next-btn').addEventListener('click', () => {
  game.nextRound();
});

// Play again button
document.getElementById('play-again-btn').addEventListener('click', () => {
  game.startGame(selectedContinent);
});

// Home buttons
document.getElementById('game-home-btn').addEventListener('click', () => {
  game.goHome();
  ui.showScreen('start');
});

document.getElementById('end-home-btn').addEventListener('click', () => {
  ui.showScreen('start');
});
