# Romantiverse Bingo

**Brought to you by the Cheese Louise Podcast**

A cinematic romance movie-night bingo game. React + Vite, deterministic bingo scoring, explainable movie trope analysis, and an installable PWA.

## Current playable features
- 5×5 bingo board with all 12 winning lines, free-center option, mark/undo, autosave
- Four modes: Classic, Cheese Chase, Blackout, Movie Marathon (movie-night history)
- Card Workshop: swap non-free squares without duplicates
- Curated Cheese Trait ontology and season-specific trope vocabulary
- Explainable synopsis clues versus **unverified** genre predictions
- Seeded deterministic cards, configurable Cheese Trait ratio (default 50/50), difficulty presets
- Search and filter **three clearly labeled fictional demo movies**; custom movie title support
- Favorites, shareable text card, local Cheese Tray history and results
- Responsive cinematic romance UI, manifest and service-worker foundation

## Not connected yet
- Real Hallmark movie catalog, licensed posters or real scene evidence
- Generative AI provider, semantic model, or live movie-watching AI
- Real-time multiplayer, room codes, cloud accounts or Supabase sync
- QR-code joining, remote authoritative scoring or server-side AI verification
- User-verified production release or full browser-device regression suite

Do not confuse planned features with completed functionality. Technical specifications and proposed schema are in [docs/INTELLIGENCE_AND_GAME_DESIGN.md](docs/INTELLIGENCE_AND_GAME_DESIGN.md) and [docs/MULTIPLAYER_SCHEMA.sql](docs/MULTIPLAYER_SCHEMA.sql).

## Development
```bash
npm install
npm test
npm run dev
npm run build
```

GitHub Actions runs tests and builds before deploying to GitHub Pages on pushes to `main`. The intended Pages address is https://moldavite333.github.io/Romantiverse-Bingo-App/ . Check the Actions tab for the actual deployment result.

## Attribution
Always use the exact text **“Brought to you by the Cheese Louise Podcast”** across the game, installable app, and future genre variants.
