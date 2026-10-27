# Romantiverse Bingo

**Brought to you by the Cheese Louise Podcast**

React + Vite movie-night bingo game with a deterministic 5×5 scoring engine, themed illustrated squares, public movie search, and shareable invitations.

## Implemented in the repository

- Four Bingo modes, independent randomized cards, free center, autosave, mark/undo, and scoring.
- Direct-link v3 invitations share only movie identity and game settings; recipients receive independently randomized cards. Sender marks and private HQ data are never included.
- 38 bundled real movie titles, a separate public Supabase movie catalog, and public Wikidata title search.
- Read-only `published_movie_posters` RPC from Cheese Louise HQ, restricted to explicitly published Bingo movies. This exposes a small public projection, **not** private HQ tables or notes.
- Both Bingo and the Cheese Louise public website fetch the same published HQ poster feed on load, on returning to the tab, and every five minutes. HQ-locked artwork wins over automatic catalog artwork for exact known title/year matches.
- A separate, public **server-side poster cache** now reuses Cheese Louise's existing `resolve-movie-poster` function (TMDB with Watchmode fallback), never exposing its API token. The 38 bundled titles were backfilled to 38 TMDB poster URLs in the private cache on October 26, 2026. Bingo fetches the public, poster-only projection on load, tab return, and every five minutes. A daily GitHub Action warms and checks the cache. The server rate-limits refreshes and persists results; HQ records are never copied into the cache.
- Poster URLs are accepted only from approved TMDB and Wikimedia Commons image paths. The default movie browser puts entries with real posters before missing-poster placeholders; searching retains relevance order. Opened invitation cards show artwork for exact known title/year matches; link previews on social platforms remain a separate milestone.
- Automated regression tests for poster precedence, title/year isolation, public metadata privacy, and browsing order.

## Known launch limitations

- The 38-title bundled catalog deliberately contains no embedded poster URLs; verified artwork is supplied by the new public cache. Database backfill is confirmed (38/38 as of October 26, 2026), but a database count alone does not establish that every browser can load every image or that the newest Pages build is deployed.
- No claim is made here that the latest GitHub commit is deployed or that the end-to-end live site has been verified. Verify GitHub Actions and test the public website and Bingo in a real browser before announcing launch readiness.
- Live authoritative multiplayer and the complete production-release QA suite remain separate milestones. See `docs/INTELLIGENCE_AND_GAME_DESIGN.md` and `docs/MULTIPLAYER_SCHEMA.sql`.

## Poster cache architecture

The Edge Function source lives in `supabase/functions/bingo-public-posters/index.ts` and is deployed to the **Cheese Louise Supabase project** (where the existing `resolve-movie-poster` and TMDB credentials already live). The schema is versioned in `supabase/migrations/20261026_bingo_public_poster_cache.sql` and is restricted to service-role access. The public GET endpoint returns only verified movie titles, release years, and approved poster URLs; it does not accept user-provided titles or permit writes. A database claim limits refresh attempts, while the server fetches the public Bingo GitHub catalog and invokes the existing resolver in bounded batches. HQ-locked posters from the separate, already public `published_movie_posters` projection remain authoritative for exact title/year matches.

## Development

```bash
npm install
npm test
npm run build
```

GitHub Actions is configured to test and build on pushes to `main`. The intended public game URL is https://moldavite333.github.io/Romantiverse-Bingo-App/ .

## Attribution

Display **“Brought to you by the Cheese Louise Podcast”** throughout the game and future themed experiences.
