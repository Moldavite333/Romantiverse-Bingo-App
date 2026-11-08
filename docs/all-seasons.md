# Spring, Summer and No Season

The public web game now offers Spring, Summer, Fall, Christmas and No Season for both solo and shared games. A player's theme can override a movie's catalog classification without rewriting movie metadata. Auto follows a known catalog classification and otherwise chooses No Season. Invitations preserve that choice; new cards and workshop suggestions use the same pool.

No Season uses 28 year-round romantic story moments and has no seasonal squares. Spring and Summer each have 25 dedicated seasonal moments and mix in the same year-round romance pool. Historical games and existing observed marks are preserved. The existing internal `Romance` value represents No Season for compatibility with saved shared games and the paused Android source.

Three catalog starter titles were added with primary-source metadata: [Spring Breakthrough (2023)](https://www.hallmarkchannel.com/mahogany-movies), [Summer Villa (2016)](https://www.hallmarkplus.com/details/VIDEO/item/MVMZ3910/summer-villa), and [Summer in the Vineyard (2017)](https://www.hallmarkchannel.com/summer-nights/new-movies-2017). No source synopsis prose or verified-scene claims were imported. Other movies remain available through title search or Play Any Movie.

## Artwork and provenance

- 50 new original raster illustrations: 25 Spring and 25 Summer.
- 17 existing romance illustrations replaced with new season-neutral compositions after snow and holiday cues were found in the old versions; 11 suitable romance illustrations retained.
- Built-in `image_gen` produced all 67 new/replacement images, each with its own scene prompt. No programmatic recolors, generic icons or sliced multi-scene sheets were used.
- Final assets: `public/illustrations/season-Spring-0.webp` through `season-Spring-24.webp`, the equivalent 25 Summer files, and the 17 `room-*.webp` replacements listed in `artwork/all-seasons-review.json`.
- Full prompt set: `artwork/scene-briefs.json`. Source PNG copies: `artifacts/seasons/sources/`. Per-asset hashes: `src/art/illustrations.json` and `src/engine/illustrationRegistry.json`.
- Six after contact sheets and two before sheets: `artifacts/seasons/contact-sheets/`. Every new/replaced scene was inspected for anatomy, expression, physical interaction, storytelling, painted craft and seasonal consistency.
- Production coverage: 181 active tropes plus the approved all-season CHEESE LOUISE POD center; 28 archived horror tropes retained. All 210 canonical images have valid, unique 384×384 WebP assets. Missing: **0**. Similarity audit errors: **0**.

## Validation and deployment

290 unit tests pass. New coverage exercises all three themes across difficulty, free-center and ratio settings, deterministic cards, independent shared cards, theme overrides, invitation round trips, and No Season's absence of seasonal squares.

Browser review covers 15 new-theme boards at 320/360/390/430/1440px, ordinary/winning/fullscreen states, fitting display labels, sharing and reload. Inventory review covers every active trope at all five widths: 40 boards and 120 state screenshots, with zero missing images, clipped labels or artwork/label overlap. The 70/30 mobile layout is preserved.

Offline verification decodes 182 cached illustration assets and all six sounds. Existing whole-app layout, multiplayer, sound, jackpot and repeated fullscreen replay regressions pass. The public-only service-worker cache is upgraded to v9 and reloads changed art when installing.

The additive `live_rooms` migration permits Spring and Summer. The `game-room` function retains its prior authentication configuration and room ownership checks. Live verification used two players in each new theme, confirmed independent cards and resolved artwork, marked a winning line, and finished each test room. No private HQ tables, policies or Android files were changed.

New repeatable checks: `node scripts/all-seasons-browser-qa.mjs` and `node scripts/verify-live-season-rooms.mjs`. The browser check is included in both deployment and browser CI workflows. Screenshots and machine-readable results are in `artifacts/seasons/`.
