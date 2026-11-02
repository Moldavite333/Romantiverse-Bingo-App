# Romantiverse Bingo illustration audit

The web game now uses individual painted scenes instead of regex-selected category motifs. Every registered scene was generated with the built-in image_gen tool, optimized to WebP, and visually reviewed at 180 pixels and 64 pixels. Android source and release workflows remain paused and unchanged.

## Inventory

| Scope | Count |
|---|---:|
| Solo launch labels | 89 |
| Authoritative multiplayer launch labels | 114 |
| Different visible launch wordings across both | 177 |
| Canonical active trope concepts | 131 |
| Archived Horror concepts | 28 |
| Dedicated Cheese Louise branded center | 1 |
| Unique completed illustrations | 160 |
| Missing or unfinished registered illustrations | 0 |
| Duplicate canonical asset references / exact duplicate files | 0 |
| Perceptual near-duplicate candidates | 0 |

There are 46 explicitly recorded wording equivalents, such as “A snowstorm” and “A snowstorm changes plans.” These resolve to the same canonical trope, rather than becoming separate concepts. All 114 multiplayer launch labels resolve to different canonical assets within that inventory. See [the complete inventory](inventory.md) and [the exact room migration map](../../src/art/room-illustration-aliases.json).

The unused prototype pool in `src/data/catalog.js` has no imports in the active application. Public catalog helper functions for loading arbitrary curated tropes are likewise not called by the current app. Imported editorial traits are open-ended: unregistered IDs deliberately display “Illustration pending” and report an error in development. They do not receive guessed artwork.

## Underlying defects fixed

1. The old artwork module chose a shared motif from label/category regexes. Fifty-seven audited active concepts selected its generic `story` motif. Seeded decorative speckles made SVG strings differ without making the illustrations distinct.
2. Multiplayer assigned IDs such as `cheese-0` *after shuffling*. The same ID could represent different labels on different cards. New room cards receive stable semantic IDs. Existing positional IDs migrate through an exact approved-label map, preserving card order, marks and revisions.
3. Unknown labels silently reached generic fallbacks. The renderer now explicitly flags unregistered or broken images; the build rejects missing files, incorrect canonical paths, duplicated paths or bytes, excessive sizes, changed review hashes, and pending visual reviews.

## Art direction and production

Vintage Christmas cards, painted storybook scenes and mid-century editorial composition; cream, cranberry, muted coral, forest green and warm gold. Every scene has a separate narrative brief, a clear focal action and expressive human poses. Fall artwork uses autumn settings; archived Horror artwork uses restrained storybook suspense. The free center features an original cheese host at a vintage podcast microphone, with the exact wording **CHEESE LOUISE POD**.

The final prompt set is the shared direction above plus the dedicated briefs in [illustration-scenes.mjs](../../scripts/illustration-scenes.mjs), [room-illustration-scenes.mjs](../../scripts/room-illustration-scenes.mjs), and [illustrations.json](../../src/art/illustrations.json). No category icon library or recolored SVG template was used to create these assets. Two scenes were regenerated after visual inspection to clarify romantic realization and the extraordinary Christmas miracle.

All delivered images are square, 384 × 384 WebP files, with a largest file of 61,856 bytes. The complete 160-image set is 6,657,974 bytes. The service worker precaches only the 132 active images; archived artwork remains available for legacy cards without reopening Horror as a launch collection.

## Visual evidence

[Before and after comparison](before-after.png)

Contact sheets show every canonical trope, its label and ID, and a separate 64-pixel preview:

[1](contact-sheet-01.png) · [2](contact-sheet-02.png) · [3](contact-sheet-03.png) · [4](contact-sheet-04.png) · [5](contact-sheet-05.png) · [6](contact-sheet-06.png) · [7](contact-sheet-07.png)

[Mobile card](screenshots/bingo-390.png) · [Desktop winning card](screenshots/bingo-winning-1440.png) · [Mobile multiplayer win](screenshots/multiplayer-winning-390.png)

## Validation

- 250 Node tests passed, including deterministic dealing/scoring, invitation privacy, room races, reconnect state, canonical artwork coverage, stable server IDs, exact legacy migration and podcast attribution.
- `npm run build` equivalents passed with the strict 160-image registry gate. No missing assignments, broken paths, shared canonical references, duplicate bytes, stale review hashes or file-size violations.
- Pillow decoded every file, verified uniform dimensions and screened all pairs using a 256-bit difference hash. No near-duplicate candidates were found. This is a screening check; the contact-sheet inspection supplies semantic and visual review.
- The full browser smoke suite passed at 320, 390 and 1440 pixels: distinct images, no horizontal overflow, selected/unselected/winning states, full-opacity art, keyboard marks, independent invitation cards, autosave, movie discovery, published HQ poster precedence, and public metadata isolation.
- The separate two-player browser suite passed with a touch-sized host and desktop guest, old and new room IDs, copy/share fallbacks, independent cards, server-confirmed wins and reduced-motion behavior.
- A real service worker cached all 132 active scene files, reloaded an illustrated 25-square card offline, and accepted offline marks. Its cache contained no invitation/session query parameters.

Local browser verification used installed Chrome with temporary profiles and deterministic public API fixtures. It does not claim a physical Android device test. Native development, APK publishing and tester recruitment were not resumed.

## Maintenance

Use `node scripts/build-illustration-inventory.mjs` when changing authoritative pools. Unchanged entries retain provenance and review records; changed scene briefs lose their review record. Supply an explicit ID-to-source map to `scripts/prepare-illustration-assets.py`, inspect the resulting contact sheets and actual cards, and record visual review only after inspection. Run `npm test`, `npm run art:validate`, `python scripts/check-image-content.py`, `npm run build`, and all three browser smoke scripts before publishing. CI enforces these checks and verifies published active image bytes against the build.
