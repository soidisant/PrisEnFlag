import './styles/main.css';
import { GameEngine } from './game/GameEngine.js';
import { UIController } from './ui/UIController.js';

const ui = new UIController();
const game = new GameEngine(ui);

// Start button
document.getElementById('start-btn').addEventListener('click', () => {
  game.startGame();
});

// Submit answer button
document.getElementById('submit-btn').addEventListener('click', () => {
  game.submitAnswer();
});

// Next round button
document.getElementById('next-round-btn').addEventListener('click', () => {
  game.nextRound();
});

// Play again button
document.getElementById('play-again-btn').addEventListener('click', () => {
  game.startGame();
});
