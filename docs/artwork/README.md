# Romantiverse scene illustration overhaul

Audit and visual review: November 1, 2026. Public web only. Android source and its manual-only workflow are unchanged.

## Inventory and cause

The baseline was commit `b4d710feb510b18a4006efe86f6ef433819b4617` in `Moldavite333/Romantiverse-Bingo-App`, the app at `https://bingo.cheeselouisepod.com/`. The separate Romantiverse homepage links to this app; its obsolete embedded Bingo was not the production target.

| Inventory | Distinct tropes | Dedicated images |
| --- | ---: | ---: |
| Current launch: universal, Romance, Christmas, Fall | 130 | 130 |
| Retained Horror definitions, excluded from public launch | 28 | 28 |
| Branded CHEESE LOUISE POD center | — | 1 |
| Total | 158 | 159 |

The solo engine contributes 36 universal and 78 seasonal definitions. Live rooms contribute 142 labels, including synonyms and 44 additional distinct tropes. These inventories now resolve to 158 canonical trope illustrations. Imported editorial packages remain open-ended; unregistered imported labels are explicitly identified as missing, not represented by invented scenes.

The old renderer looked up 25 SVG scenes by full label, then chose category/keyword icons and a generic story icon. Only 15 canonical labels matched one of those scenes. The other 143 fell through to category artwork, including 61 assigned the generic story motif. Seeded sparkle positions could make the image bytes differ while preserving the same generic icon. Existing artwork tests explicitly permitted that behavior. Room IDs such as `cheese-0` are shuffled positions, not stable trope identities.

## Implementation

- `src/engine/illustrationRegistry.json`: immutable canonical ID/label/path/status assignments. Each canonical trope has a separate 384×384 WebP, with one additional branded center.
- `src/engine/roomIllustrationAliases.json`: explicit, reviewed mappings for all 142 legacy server labels. This compatibility layer handles temporary room IDs without modifying the server's dealing, room data, marks, tokens, or invitation protocol.
- `src/engine/illustrations.mjs`: ID lookup, stale-label protection, and narrowly scoped explicit legacy aliases. No category, keyword, seed, supplied URL, or generic icon fallback.
- `src/TropeIllustration.jsx`: both solo and multiplayer use the same renderer. Unknown associations and failed image loads display an accessible “Illustration unavailable” state.
- `src/illustrations.css`: approximately 64 px scenes at a 390 px viewport and 96 px at desktop. A 320 px viewport fits approximately 50 px scenes. Labels wrap without clipping. Selection and winning states preserve image colors and use frame/label styling and a corner marker.
- `public/sw.js`: previously viewed public illustrations are eligible for offline caching. Room state and private tokens are not cached.

Every image was produced separately with the built-in image-generation tool, using a distinct narrative brief. The complete prompt set is in `scene-briefs.json`. The art direction uses warm storybook gouache, vintage holiday-card lighting, cream, cranberry, coral, forest green and gold. The center is an original cheese-heart and microphone vignette; its visible label remains **CHEESE LOUISE POD**.

## Validation and review

`npm test` includes canonical coverage and association checks, duplicate references, SHA-256 duplicate content, decoded image dimensions, WebP format, broken paths, a 90 KB per-image budget, and 64-bit difference-hash similarity detection. A distance of 5 or less fails validation; 6–10 creates a visual-review warning. This detects likely visual duplicates, not semantic correctness; the contact sheet and actual cards still require visual inspection.

The completed inventory passed with 159 images, zero unfinished entries, zero errors and zero similarity warnings. Total optimized image size: 5,170,326 bytes. All seven contact-sheet pages were visually inspected against the labels; no reused scenes or generic category icons remained. Representative Christmas and Fall cards were inspected at mobile and desktop sizes. The expressive scene, rather than a generic symbol, distinguishes the snowfall, blizzard, wish, miracle, kiss, reunion, visitor and announcement moments.

All 252 automated tests pass. Browser checks cover 320/390/1440 px layouts, six saved-card theme/viewport combinations, unselected/selected/winning states, image decoding, distinct card image references, clipping, horizontal overflow, autosave, keyboard marking, the protected free center, broken-image messaging, direct invitations, independent guest cards, poster precedence and public metadata isolation. The room browser fixture additionally covers mobile host sharing/copy fallbacks, desktop guest joining, server-confirmed winning lines, independent marks and reduced motion. Existing room transport, revision/reconnection and deterministic card regression tests remain intact.

## Reproducing checks

```sh
npm install
npm test
npm run artwork:check
npm run build
npx playwright install chromium
node scripts/browser-smoke.mjs
node scripts/browser-multiplayer-smoke.mjs
npm run test:artwork-browser
npm run artwork:contact-sheet
```

The contact-sheet command creates seven PNG pages and a portable HTML sheet under `artifacts/artwork/`. Screenshot evidence includes baseline and updated Christmas/Fall cards, full pages, selected and winning states, and mobile/desktop multiplayer screens. The deployment workflow runs the automated and browser gates before uploading the website and retains the evidence as an Actions artifact. It then verifies live asset deployment and a real two-player room.

To import replacement generated images, create a local `docs/artwork/generated-sources.json` array of `{ "id": "canonical-id", "path": "absolute-source-image-path" }` records, then run `node scripts/import-illustrations.mjs`. This source-path manifest is ignored by Git. Final web assets and complete prompts are versioned in the repository. A new trope requires an explicit brief, original image, registry entry, and validation before it is considered illustrated.

The exact attribution remains **Brought to you by the Cheese Louise Podcast**. No movie facts, scoring rules, published poster ordering, private HQ data permissions, Android files, or multiplayer backend source were changed.
