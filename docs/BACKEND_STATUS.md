# Romantiverse Bingo backend

**Brought to you by the Cheese Louise Podcast**

A dedicated Supabase project named **Romantiverse Bingo** was created under the same organization as the Cheese Louise project, but with a separate database.

Project ref: `yxpamyibhclilgdhgsjd`
Region: `us-west-1`
URL: `https://yxpamyibhclilgdhgsjd.supabase.co`

## Applied
- Initial schema migration: movies, tropes, movie_tropes, game_rooms, game_players, game_events.
- Row-level security enabled for all six tables.
- Public **read-only** policies for movie metadata, enabled trope definitions, and movie-trope evidence.
- No public write policies for multiplayer tables; rooms cannot yet be joined or played through the API.
- Ten curated starter trope definitions inserted with explicit observable triggers and ambiguity guidance.

## Not applied
- No real movie records or licensed artwork ingested yet.
- No generative AI API or model credentials connected.
- No Edge Function for movie analysis deployed.
- No multiplayer join/auth/claim functions deployed.
- No GitHub Pages environment variables configured automatically.

## Client setup
The public catalog service in `src/services/catalog.js` uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Publishable keys are safe for browser use *when RLS is enforced*, but service-role keys must never be committed. The app still defaults to clearly labeled fictional demos until a real catalog is loaded.

## Security rules
Only trusted server functions can mutate multiplayer state. Validate membership and turn permissions server-side, implement idempotency, enforce room rate limits, and never trust client-computed scores. Movie AI responses require strict schema validation and provenance checks before inclusion.
