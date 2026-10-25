# Movie source acquisition policy

**Brought to you by the Cheese Louise Podcast**

The main catalog is an editorially controlled, static JSON file. **No automated Hallmark crawling is authorized or implemented.** Metadata imports must have documented permission, provenance, and terms.

## TVmaze research adapter
`node scripts/research-tvmaze.mjs "Title"` queries TVmaze's public search API, writes an uncommitted research report, and **does not import or publish results**. TVmaze focuses on TV series and may not have individual Hallmark TV movies. Treat even exact title/year matches as unverified. The adapter records TVmaze source URLs and attribution notes. Follow its CC BY-SA attribution and ShareAlike requirements if any content is reused; do not treat TVmaze as a comprehensive Hallmark catalog.

## Editorial import
Use `node scripts/merge-catalog.mjs approved.json` only with authorized metadata and a documented `source` and `permission_note`. Then validate, run tests, compile suggestions, and build. Record appropriate credit, check duplicates and dates, and do not reuse copyrighted posters without authorization.

## Zero-cost gameplay
The published app reads the bundled JSON catalog, runs its own offline trope engine, and generates Bingo cards in-browser. No player account or paid AI API is needed. A scheduled GitHub Action can compile the local catalog without fetching third-party content. Network multiplayer remains an optional, separate guest service.

## Follow-up
To automatically discover new Hallmark films, obtain a source that explicitly permits automated catalog retrieval and redistribution. Only then enable scheduled ingestion, initially as reviewable pull requests with no automatic publication.

## Poster publication gate (October 2026)
Movie records may include a `poster_url` for editorial research, but the
public UI **does not display it** until an editor explicitly supplies
`poster_rights: { "status": "approved", "credit": "Rights-cleared source credit" }`.
The image must use HTTPS on the approved image hosts (TMDB's image CDN or
Wikimedia Commons). A TMDB image URL or a Commons upload is **not** proof of
republication rights; check the specific asset's license, commercial use,
attribution, and any TMDB API branding terms before setting approval.
Do not automatically copy poster URLs from Cheese Louise HQ or publish
private HQ records. If the image fails, the game shows original seasonal art.

The bundled starter catalog and live Supabase catalog currently have **no
rights-cleared posters**. Poster UI support does not imply posters are live.
