import './styles/main.css';
import { GameEngine } from './game/GameEngine.js';
import { UIController } from './ui/UIController.js';
import { languageManager } from './i18n/LanguageManager.js';
import { DataLoader } from './data/DataLoader.js';
import { SvgGenerator } from './utils/SvgGenerator.js';
import {
  generateChallengeId,
  generateChallengeUrl,
  parseChallengeFromUrl,
  clearChallengeFromUrl
} from './utils/ChallengeManager.js';

const ui = new UIController();
const game = new GameEngine(ui);

// Current challenge state
let currentChallengeId = null;

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

// Play Modal
const playModal = document.getElementById('play-modal');
const modalContinentBtns = playModal.querySelectorAll('.continent-btn');
const challengeLinkInput = document.getElementById('challenge-link');
const generateChallengeBtn = document.getElementById('generate-challenge-btn');
const copyChallengeBtn = document.getElementById('copy-challenge-btn');
const playChallengeBtn = document.getElementById('play-challenge-btn');

// Open modal when play button clicked
document.getElementById('play-btn').addEventListener('click', () => {
  // Reset modal state
  selectedContinent = 'all';
  currentChallengeId = null;
  modalContinentBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.continent === 'all');
  });
  challengeLinkInput.value = '';
  generateChallengeBtn.classList.remove('hidden');
  copyChallengeBtn.classList.add('hidden');
  playChallengeBtn.classList.add('hidden');

  playModal.classList.remove('hidden');
});

// Close modal
document.getElementById('modal-close-btn').addEventListener('click', () => {
  playModal.classList.add('hidden');
});

// Close modal on backdrop click
playModal.addEventListener('click', (e) => {
  if (e.target === playModal) {
    playModal.classList.add('hidden');
  }
});

// Modal continent selector
modalContinentBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    modalContinentBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedContinent = btn.dataset.continent;

    // Reset challenge when continent changes
    if (currentChallengeId) {
      currentChallengeId = null;
      challengeLinkInput.value = '';
      generateChallengeBtn.classList.remove('hidden');
      copyChallengeBtn.classList.add('hidden');
      playChallengeBtn.classList.add('hidden');
    }
  });
});

// Modal play button - starts regular game
document.getElementById('modal-play-btn').addEventListener('click', () => {
  playModal.classList.add('hidden');
  game.startGame(selectedContinent);
});

// Generate challenge button
generateChallengeBtn.addEventListener('click', () => {
  currentChallengeId = generateChallengeId();
  const url = generateChallengeUrl(currentChallengeId, selectedContinent);
  challengeLinkInput.value = url;

  generateChallengeBtn.classList.add('hidden');
  copyChallengeBtn.classList.remove('hidden');
  playChallengeBtn.classList.remove('hidden');
});

// Copy challenge link button
copyChallengeBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(challengeLinkInput.value);

    // Show feedback
    const originalText = copyChallengeBtn.textContent;
    copyChallengeBtn.textContent = languageManager.t('linkCopied');
    copyChallengeBtn.classList.add('copied');

    setTimeout(() => {
      copyChallengeBtn.textContent = originalText;
      copyChallengeBtn.classList.remove('copied');
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
});

// Play challenge button
playChallengeBtn.addEventListener('click', () => {
  if (currentChallengeId) {
    playModal.classList.add('hidden');
    game.startChallengeGame(currentChallengeId, selectedContinent);
  }
});

// Daily challenge button
document.getElementById('daily-btn').addEventListener('click', () => {
  game.startDailyGame();
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

// Share button
document.getElementById('share-btn').addEventListener('click', async () => {
  const shareText = game.getShareText();
  if (!shareText) return;

  const shareBtn = document.getElementById('share-btn');
  const originalText = shareBtn.querySelector('span').textContent;

  try {
    // Try Web Share API first (mobile-friendly)
    if (navigator.share) {
      await navigator.share({
        text: shareText
      });
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareText);

      // Show feedback
      shareBtn.classList.add('copied');
      shareBtn.querySelector('span').textContent = languageManager.t('copied');

      setTimeout(() => {
        shareBtn.classList.remove('copied');
        shareBtn.querySelector('span').textContent = originalText;
      }, 2000);
    }
  } catch (err) {
    // User cancelled share or clipboard failed - try basic clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      shareBtn.classList.add('copied');
      shareBtn.querySelector('span').textContent = languageManager.t('copied');

      setTimeout(() => {
        shareBtn.classList.remove('copied');
        shareBtn.querySelector('span').textContent = originalText;
      }, 2000);
    } catch (e) {
      console.error('Failed to share:', e);
    }
  }
});

// Hint toggle
const hintToggle = document.getElementById('hint-toggle');
const savedHints = localStorage.getItem('pris-en-flag-hints');
if (savedHints !== null) {
  hintToggle.checked = savedHints === 'true';
}

hintToggle.addEventListener('change', (e) => {
  game.unifiedMap?.setHintsEnabled(e.target.checked);
  localStorage.setItem('pris-en-flag-hints', e.target.checked);
  if (!e.target.checked) {
    ui.hideCandidatesPanel();
  }
});

// Glossary / Explore Flags
const glossaryDataLoader = new DataLoader();
const svgGenerator = new SvgGenerator();
let glossaryLoaded = false;
let glossarySelectedContinent = 'all';

async function loadGlossary() {
  if (glossaryLoaded) return;

  const data = await glossaryDataLoader.load();
  svgGenerator.setGeoJSON(data.geojson);

  const countries = glossaryDataLoader.getCountryList()
    .sort((a, b) => (a.name.en || a.name).localeCompare(b.name.en || b.name));

  ui.renderGlossary(countries, (code) => svgGenerator.getSVG(code));
  glossaryLoaded = true;
}

function filterGlossaryResults() {
  const searchTerm = document.getElementById('glossary-search').value;
  ui.filterGlossary(glossarySelectedContinent, searchTerm);
}

// Explore button
document.getElementById('explore-btn').addEventListener('click', async () => {
  await loadGlossary();
  ui.showScreen('glossary');
});

// Glossary home button
document.getElementById('glossary-home-btn').addEventListener('click', () => {
  ui.showScreen('start');
});

// Glossary search input
document.getElementById('glossary-search').addEventListener('input', () => {
  filterGlossaryResults();
});

// Glossary filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    glossarySelectedContinent = btn.dataset.continent;
    filterGlossaryResults();
  });
});

// Check for challenge URL on page load
const challengeFromUrl = parseChallengeFromUrl();
if (challengeFromUrl) {
  // Clear challenge from URL to prevent re-triggering on refresh
  clearChallengeFromUrl();

  // Start the challenge game
  game.startChallengeGame(challengeFromUrl.challengeId, challengeFromUrl.continent);
}
