# Romantiverse Bingo — Movie intelligence and game mathematics

**Brought to you by the Cheese Louise Podcast**

## Definitions
A **Cheese Trait** is a recurring *narrative device, behavior, or contrivance* typical of formulaic romantic movies. Examples: a preventable misunderstanding, the almost-kiss, a late grand gesture, or an old flame returning. A **trope** is a recognizable recurring narrative or visual convention, including seasonal motifs such as tree lightings or pumpkin-patch dates. A Cheese Trait can be a trope, but not every trope is a Cheese Trait. Cards distinguish broad story-pattern traits from concrete seasonal/movie motifs.

## Observable, judgeable square requirements
A square must describe a moment a human viewer can reasonably recognize and mark, not a vague opinion or spoiler. Prefer “A kiss is interrupted” over “True love wins.” Avoid duplicate or strongly overlapping squares on the same card, as one scene should not automatically satisfy many tiles. A player is the arbiter of whether a scene occurred. The model must **never** mark squares on behalf of the viewer without evidence and consent.

## Movie intelligence
The current v2 implementation is a deterministic, **non-generative** analysis layer:
1. Normalize movie title/synopsis.
2. Map exact synopsis signals to a curated Cheese Trait ontology.
3. Rank traits by heuristic confidence, explicitly labeling evidence as **synopsis clue** or **genre prediction**.
4. Generate seasonal motifs with prediction-only labels.
5. Draw an exact target mixture (default 12 Cheese Traits + 12 seasonal motifs for a 24-playable-square card) using a seeded shuffle.
6. Support difficulty by ranking relative likelihood. Do not imply the confidence is calibrated probability of an on-screen event.
7. Freeze selected card data once a game starts; edits must be explicit and immutable.
8. Marking, bingo detection, and scoring are pure deterministic operations independent of movie analysis.

## Future generative AI service contract
Requires a server-side API, credentials, rate limiting, and licensed/approved metadata sources. Never expose model credentials to the client. Model output must be validated server-side against a strict schema before use:
- movie_id, title, release_year, source_provenance, synopsis
- traits[]: id, label, category (cheese/seasonal/movie), evidence_kind (verified_scene/synopsis_inference/genre_prediction), evidence_excerpt (when permitted), confidence, observable_trigger, ambiguity_risk, spoiler_level, correlated_trait_ids
- catalog_version, analysis_version, analyzed_at
- No unsupported scene assertions. “Verified scene” requires an actual authorized scene-level source, not a model guess.
- Strip copyrighted synopsis excerpts beyond rights. Do not scrape or display unlicensed posters.
- Model can **propose** candidate tropes; deterministic validation and game logic decide which are eligible.
- Human editors can accept/reject candidates and update canonical Cheese Traits.
- Monitor drift, hallucinations, coverage, calibration, and false positives.

## Game balance
The 5×5 card has 12 winning lines: five rows, five columns, two diagonals. The free center is a marked square. A 50/50 split for a 24-square playable card is 12+12. The no-free variant has 25 squares; a 50% ratio rounds to 13 Cheese Traits and 12 seasonal motifs.

Naive random cards may be unwinnable if rare tropes cluster along winning lines. Future calibration should optimize expected completion:
- Estimate per-square occurrence frequency using **observed and consented play data**, not arbitrary model confidence.
- Use simulation with correlated events (e.g., tree lighting and Christmas festival) rather than independent Bernoulli assumptions.
- Evaluate P(at least one Bingo), time to first Bingo, win rate by difficulty, and variation across cards for the same movie.
- Avoid universally guaranteed Bingo and nearly impossible Bingo. Set target win-rate bands from real playtests.
- Keep games fair across players: sample from the same frozen movie pool, and use comparable difficulty distributions.
- A live multiplayer backend must be authoritative for room state, claims, clocks, deduplication, and reconnects.

## Modes
- Classic: one or more complete lines counts as a Bingo.
- Cheese Chase: count total completed lines at credits.
- Blackout: all 25 positions marked (including free).
- Movie Marathon: accumulate movie-night results across games; the current local history provides this foundation.

## Test strategy
Unit: determinism, unique squares, exact ratio, immutable edits, free center, 12 winning patterns, malformed input, confidence/evidence labels. Integration: generate → edit → mark → finish → history → resume. E2E: mobile viewport, tap targets, keyboard and screen reader, reload persistence, install/offline behavior, updates, deployment and caching. Security: XSS escaping, server-side validation, access controls, room abuse prevention, rate limits.

## Delivery phases
1. **Playable local game:** responsive cinematic design, four modes, explainable trope selection, Card Workshop, local Cheese Tray, sharing, PWA.
2. **Real movie catalog:** legitimate licensed/allowed metadata and poster handling, favorites, search, verified data provenance.
3. **Server-side generative AI:** validated schema, source evidence, review tooling, observability and budgets.
4. **Real-time multiplayer:** authenticated/guest rooms, QR invitations, server authority, reconnect and anti-abuse.
5. **Calibration:** analytics with user consent, Monte Carlo simulations, playtests, card fairness improvements, full regression suite.

Do not claim a phase is complete merely because its interface or documentation exists.
