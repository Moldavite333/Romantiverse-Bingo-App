# Romantiverse Bingo

**Brought to you by the Cheese Louise Podcast**

React + Vite movie-night bingo game with a deterministic 5×5 scoring engine, themed illustrated squares, public movie search, and shareable invitations.

## Implemented in the repository

- Four Bingo modes, independent randomized cards, free center, autosave, mark/undo, and scoring.
- Direct-link v3 invitations share only movie identity and game settings; recipients receive independently randomized cards. Sender marks and private HQ data are never included.
- 38 bundled real movie titles, a separate public Supabase movie catalog, and public Wikidata title search.
- Read-only `published_movie_posters` RPC from Cheese Louise HQ, restricted to explicitly published Bingo movies. This exposes a small public projection, **not** private HQ tables or notes.
- Both Bingo and the Cheese Louise public website fetch the same published HQ poster feed on load, on returning to the tab, and every five minutes. HQ-locked artwork wins over automatic catalog artwork for exact known title/year matches.
- Poster URLs are accepted only from approved TMDB and Wikimedia Commons image paths. The default movie browser puts entries with real posters before missing-poster placeholders; searching retains relevance order.
- Automated regression tests for poster precedence, title/year isolation, public metadata privacy, and browsing order.

## Known launch limitations

- The 38-title bundled catalog has no embedded poster URLs. Published HQ titles may enrich matching entries at runtime, but **most bundled titles still need a verified external poster-matching/enrichment source**. A working HQ feed is not the same as complete poster coverage.
- No claim is made here that the latest GitHub commit is deployed or that the end-to-end live site has been verified. Verify GitHub Actions and test the public website and Bingo in a real browser before announcing launch readiness.
- Live authoritative multiplayer and the complete production-release QA suite remain separate milestones. See `docs/INTELLIGENCE_AND_GAME_DESIGN.md` and `docs/MULTIPLAYER_SCHEMA.sql`.

## Development

```bash
npm install
npm test
npm run build
```

GitHub Actions is configured to test and build on pushes to `main`. The intended public game URL is https://moldavite333.github.io/Romantiverse-Bingo-App/ .

## Attribution

Display **“Brought to you by the Cheese Louise Podcast”** throughout the game and future themed experiences.
