# Pris en Flag

<p align="center">
  <img src="logo.jpg" alt="Pris en Flag" width="200" style="border-radius: 50%;" />
</p>

<p align="center">
  <strong>A geography quiz game where you guess countries from their flags!</strong>
</p>

<p align="center">
  <a href="https://prisenflag.netlify.app/">Play Now</a>
</p>

---

## About

**Pris en Flag** is an interactive geography game that tests your knowledge of world flags. A flag is displayed and you must locate the correct country on the map. The faster you answer and the fewer hints you use, the higher your score!

## Features

- **Single unified map** - Full-screen interactive map powered by Leaflet
- **Progressive hint system** - Stay idle and hints will help you:
  - Continent highlight (dims other continents)
  - Candidate countries (narrows down to ~10 options)
  - Elimination (progressively removes wrong answers)
- **Candidates panel** - Shows country shapes as clickable shortcuts
- **Hint toggle** - Enable/disable hints for harder gameplay
- **Region selection** - Play with all countries or focus on a specific continent
- **Difficulty progression** - Early rounds feature well-known countries, later rounds get harder
- **Bilingual** - Available in English and French
- **Score breakdown** - Time bonus, hint bonus, and capital bonus

## How to Play

1. A flag appears in the top-left corner
2. Click on the map to place your guess
3. Submit your answer before time runs out (30 seconds)
4. Score points based on:
   - **Time bonus** - Answer quickly for more points
   - **Hint bonus** - Use fewer hints for more points
   - **Capital bonus** - Click near the capital for bonus points

**Tips:**
- Stay idle to receive progressive hints
- Use the candidates panel for quick selection (but 50% score penalty)
- Turn off hints for a harder challenge

## Tech Stack

- **Vite** - Build tool
- **Leaflet** - Interactive maps
- **Vanilla JavaScript** - No framework dependencies
- **GeoJSON** - Country boundaries

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## License

MIT

---

<p align="center">
  Made with flags from around the world
</p>
