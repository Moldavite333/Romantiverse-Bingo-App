# Static-first, account-free Romantiverse Bingo

**Brought to you by the Cheese Louise Podcast**

## Locked architecture
1. The core game loads `public/catalog/movies.json` from the same GitHub Pages deployment. No login, database account, runtime API call, paid AI provider or key is needed for solo play.
2. The browser's deterministic `src/engine/intelligence.mjs` uses movie titles and synopsis text to rank Cheese Traits and seasonal tropes. No LLM, no token charges, and no claims that a predicted scene was verified.
3. A human/editorially approved, permitted metadata source may be imported with `node scripts/merge-catalog.mjs approved-movies.json`. The input must declare `source` and `permission_note`. Run `node scripts/validate-catalog.mjs`, `npm test`, and `npm run build` before publishing.
4. The CI workflow validates the catalog and game engine on changes. It does not scrape Hallmark or automatically acquire unauthorized third-party metadata.
5. Optional online multiplayer remains a distinct Supabase guest service. It needs network and hosting resources, even though players never log in; free-tier availability is not guaranteed.
6. The existing Supabase movie catalog and rule-based server analysis are legacy optional services. Solo play must never depend on them.
7. Catalog starter records are editorial seed data, not scene-verified, and should be checked against official sources before being marked verified.

## Future permitted automatic updates
When a suitable licensed feed, partner permission, or authorized public data API is available, build a scheduled GitHub Action that fetches only that feed, normalizes and validates records, creates a reviewable PR, and updates the static catalog after checks. Respect source terms, licensing, rate limits, attribution, and image rights. **Do not schedule unauthorized crawling of Hallmark's site.**

## Costs
Static solo game logic has no per-play AI inference or database charges. GitHub Pages/Actions have plan and usage conditions. Multiplayer infrastructure and data acquisition may incur costs. There is no guaranteed perpetual zero-cost external hosting.
