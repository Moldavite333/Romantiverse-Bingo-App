# Unattended discovery and Cheese Master synchronization

## Zero-touch player experience
Bingo uses the static movie catalog and its locally bundled inference engine. No sign-in, import, API key, or request to Cheese Louise HQ is needed. Each player's Bingo card is created on their device.

## Daily public rule sync
`.github/workflows/sync-cheese-master.yml` reads only the public `cheese-master.js` code in `Moldavite333/Cheese-Louise`. The parser extracts the declarative `CM_CONCEPTS` regular-expression vocabulary and rejects unexpected executable syntax. It does not read Supabase, personal accounts, podcast notes, private trait feedback, or TMDB tokens. Tests, catalog validation and build must succeed before commit. A commit to main triggers the Pages deployment workflow.

## Weekly open-data discovery
`.github/workflows/auto-catalog.yml` requests Wikidata public film metadata. It adds only films with a valid year and either a recognized **original broadcaster** (Hallmark Channel/Mystery/Family or Lifetime/LMN) or a **made-for-television film** classification with MarVista Entertainment or Reel One Entertainment as a production company. A company credit on an ordinary theatrical film does **not** qualify it. These are Wikidata metadata claims, not independent editorial verification; imported entries remain marked `unverified`. Titles without a reliable season are labeled `Unspecified`, not silently discarded or categorized as Christmas. Players choose the card theme for those titles; that choice never becomes verified movie metadata. No source descriptions are stored. Duplicate title/year pairs are rejected. The catalog must pass validation and build before committing.

## Failure policy
Network errors or changed upstream formats fail closed. The last deployed static app remains usable; a failed scheduled job does not mean the catalog has refreshed. Check GitHub Actions for actual success.

## Honest limitations and next steps
1. Wikidata coverage for Hallmark, Lifetime, MarVista and Reel One is incomplete and may produce zero eligible additions. Many films have missing broadcaster, production-company, or television-film classifications. This is **not** a comprehensive automatic premieres feed, and a successful scheduled run does not prove catalog completeness.
2. Public source-code synchronization transfers the hard-coded concept recognition vocabulary, **not** private Cheese Louise workspace traits, human corrections or feedback-learning state.
3. An approved, public, machine-readable movie data feed is still needed for reliable weekly premieres and permitted story-context extraction.
4. GitHub Actions scheduling, repository write permissions and Pages configuration must be verified in the live repository. Scheduled workflows can be delayed or disabled by GitHub.
5. Automated end-to-end movie quality and card-win-rate measurements are not yet implemented.

**Brought to you by the Cheese Louise Podcast**
