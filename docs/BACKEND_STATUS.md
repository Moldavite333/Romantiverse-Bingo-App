# Romantiverse Bingo — live service status

**Brought to you by the Cheese Louise Podcast**

Supabase project `yxpamyibhclilgdhgsjd`, separate from the Cheese Louise podcast project.

## Live backend deployed
- Public read-only movie catalog (six real Hallmark movie entries initially, with scene verification explicitly **unverified**).
- Secure RLS: catalog reads allowed; no anonymous database writes to movies, tropes, multiplayer rooms or events.
- Curated trope definitions with observable triggers and ambiguity guidance.
- Supabase Edge Function `analyze-movie` version 1, status **ACTIVE**.
- The deployed endpoint performs **rules-based server-side analysis** (not generative AI), labels synopsis clues and predictions, and never claims scene verification.
- GitHub app code now loads live movies and calls the server analysis endpoint, with transparent local fallback.
- Public publishable key only; no service-role secret is in the browser.

## Still required
- A real generative AI provider API key configured **server-side** and a validated prompt/schema pipeline. None is connected; never describe rules-based analysis as an LLM.
- Authenticated multiplayer room creation, joining, membership RLS or server functions, realtime synchronization, reconnect, idempotent scoring and anti-abuse. The database tables exist, but gameplay is **not live**.
- Catalog enrichment and independent verification of official movie metadata and URLs. No licensed movie posters are loaded.
- Confirm GitHub Pages build/deployment, HTTP response of Edge Function and browser-level E2E tests. An Edge Function status of ACTIVE is deployment confirmation, not an end-to-end request test.

## Important safety
Do not grant public insert/update/delete policies on multiplayer tables. Only authenticated and authorized server-side functions should mutate room state. The server analysis endpoint currently does not incur LLM token charges, but should receive rate limiting and abuse monitoring before expensive generative inference is enabled.

## Multiplayer implementation update
- Applied `secure_guest_multiplayer_rooms` migration: `live_rooms`, `live_players`, and `live_actions` with RLS and no client-access policies.
- Deployed Supabase Edge Function `game-room` version 1 (ACTIVE): create/join/state/start/mark/finish endpoints, 7-character codes, 12-player limit, 12-hour expiry, per-player secret tokens, server-held cards and marks, optimistic revision checks, server-side winning-line calculation.
- Added React `Play Together` screen with a lobby, independent player cards, 3-second state polling, reconnect using sessionStorage, and server-based mark updates.
- **Limitations:** not yet independently exercised end-to-end from a browser; not production-hardened against room creation abuse; no durable idempotency event log on requests despite schema; polling is not realtime subscriptions; no authenticated accounts, cross-device session recovery, QR code, chat or calibrated game probabilities. Do not advertise as production-ready.
- Public unauthenticated guest-room API is subject to abuse. Add rate limits, per-IP throttling, session expiry cleanup, and transaction-level idempotency before large-scale release.
