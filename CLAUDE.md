# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pris en Flag is a browser-based JavaScript game where players guess countries from their flags. Features a split-screen interface with an auto-zooming clue map and an interactive answer map.

## Commands

```bash
npm run dev      # Start development server on port 3000
npm run build    # Build for production (output: dist/)
npm run preview  # Preview production build locally
```

## Architecture

```
src/
├── main.js              # Entry point, event listeners
├── game/
│   ├── GameEngine.js    # Core game orchestration, round management
│   ├── ScoreManager.js  # Scoring algorithm (time + zoom + capital bonuses)
│   └── Timer.js         # Round timer with animation frame loop
├── maps/
│   ├── ClueMap.js       # Non-interactive map with progressive zoom animation
│   ├── AnswerMap.js     # Interactive map with click-to-place-pin, country detection
│   └── mapUtils.js      # Shared Leaflet utilities, distance calculation
├── data/
│   └── DataLoader.js    # Fetches and parses country data
└── ui/
    └── UIController.js  # DOM manipulation, screen management
```

## Key Patterns

- **Maps use Leaflet.js** - Both ClueMap and AnswerMap wrap L.map instances
- **Country detection** uses `@mapbox/leaflet-pip` for point-in-polygon queries on GeoJSON layer
- **Animation** uses `requestAnimationFrame` loops (ClueMap zoom, Timer ticks)
- **Scoring formula**: `timeBonus (0-1000) + zoomBonus (0-500) + capitalBonus (200)`

## Data Files

Located in `public/data/`:
- `countries.geojson` - Country boundaries from Natural Earth (14MB, can be optimized)
- `countries.json` - Country metadata: name, capital, center coords, flag URL

To regenerate `countries.json` from raw data:
```bash
node scripts/processCountries.js
```

## Game Flow

1. `GameEngine.startGame()` → loads data, shows game screen
2. `GameEngine.nextRound()` → picks random country, starts zoom animation + timer
3. Player clicks AnswerMap → `leaflet-pip` detects country, highlights it
4. Player submits or timer expires → `ScoreManager.calculateRoundScore()` called
5. After 10 rounds → `endGame()` shows final score
