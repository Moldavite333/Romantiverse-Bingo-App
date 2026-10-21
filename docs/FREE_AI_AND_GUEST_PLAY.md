# Product constraints: no login and zero required AI fees

**Brought to you by the Cheese Louise Podcast**

## Guest-first
- Solo: choose a movie and play immediately. No account, email, password, or payment.
- Multiplayer: nickname + seven-character room code. The room service issues a random secret session token; only the token hash is stored in the database. The token is stored in sessionStorage for reconnects in the same browser tab/session.
- A room code is **not** an authentication token. A player token is private and must never be embedded in a shared link.
- Expiry is 12 hours. Cross-device recovery is not available without a separate recovery mechanism.
- Current implementation needs a security and load test before public launch: rate limits, quotas, origin checks, race conditions, transactional idempotency, host-only UI, expired room cleanup.

## Free movie intelligence
1. Curated Cheese Trait definitions with observable triggers and exclusions.
2. Local synopsis/title tokenization, phrase matching and aliases; distinguish plot clues from unverified genre predictions.
3. Theme inference (Christmas, Fall, Horror) with local heuristics.
4. Deterministic 50/50 Cheese Trait vs seasonal trope card generation.
5. No generative model is required. No user login or AI subscription.
6. Free public catalog metadata can be used only when its license and usage terms permit it. Avoid unauthorized scraping and copyrighted poster reuse.
7. User-confirmed trope outcomes can improve ranking, **only with consent** and privacy-preserving aggregate statistics; do not silently collect movie-watch behavior.

## Important truth in product copy
Rules-based NLP is not an LLM. The current server analysis is also rules-based. Neither can confirm scenes merely from a synopsis. A powerful free generative provider may have rate limits, may change terms, and may not remain free. The game must not require it.

## Future zero-cost improvements
- Grow and editorially review the Cheese Trait ontology, including semantic duplicates, mutually exclusive tropes, negative evidence and concrete markability.
- Build reusable story-archetype profiles: returning hometown professional, inherited inn, rivals-to-lovers, holiday travel disruption, pretend relationship, festival deadline.
- Add optional on-device models only when performance, mobile battery, privacy, and model licenses are proven acceptable; download size should be explicit and the feature must be optional.
- Use open-source local embedding or small language models for offline semantic matching on capable devices, with deterministic fallback.
- Evaluate with a curated, human-labeled movie/trope dataset and report precision, recall, card win-rate calibration, mobile load time and memory usage.
- Protect free public services from abuse using quotas, caching and monitoring. Hosting/database/network may incur charges even when AI inference does not.
