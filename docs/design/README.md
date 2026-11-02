# A cohesive illustrated game

The same Romantiverse storybook direction now runs through the whole public web experience, including movie browsing, setup, play, wins, Workshop, multiplayer, results, history and app icons.

## Visual system

| Role | Treatment |
|---|---|
| Page and panels | Warm cream paper, fine rules and restrained corners |
| App frame and card | Forest green, with a bounded desktop window and a compact play header |
| Primary action | Cranberry, with matching selection borders and ink-like check stamps |
| Winning line | Forest-green squares, cream labels and gold outlines; artwork retains full opacity |
| Free center | Gold paper and the dedicated Cheese Louise podcast host |
| Typography | Editorial serif headings, consistent small labels and readable body/control text |
| Images | Individual painted trope scenes, framed hero illustrations and approved movie posters |
| Missing/slow posters | Branded artwork remains visible while a verified poster loads; failed posters retain the fallback |

Movie cards use a poster-and-title layout. Theme filters, game modes, Workshop tiles and favorites have matching selected states. Desktop play places the card beside movie-night guidance and controls. Narrow screens stack these sections and keep the board, labels and tap targets intact. Host and join forms sit alongside each other on desktop. Existing room cards, marks, autosave, invitation handling, scoring and movie/poster precedence are unchanged.

Workshop now shows the actual assigned illustrations, including thumbnail suggestions and the branded protected center. Results and the Cheese Tray share the same paper surfaces, typography, buttons and podcast identity. The installable-web-app colors, favicon and icons match the game. Native Android work remains paused.

## Screens

[Welcome](discover-1440.png) · [Movie browsing with approved public posters](movie-browsing-1440.png) · [Desktop play](game-1440.png) · [A completed Bingo](bingo-1440.png) · [Mobile play](game-390.png) · [Host and join](together-1440.png)

## Verification

- 250 existing and artwork regression tests passed; production build and all 160 illustration checks passed.
- Whole-product browser checks covered 11 screen/state groups at 320 × 844, 390 × 844, 900 × 1000, 1440 × 1000 and 1920 × 1080.
- No horizontal overflow or browser errors were found. Desktop card/companion columns and mobile stacking were verified.
- Measured contrast: primary actions 7.32:1; selected modes 11.19:1; unmarked square labels 11.24:1; marked labels 8.10:1; winning labels 10.80:1.
- Existing solo/invitation, two-player multiplayer and real offline-browser suites passed. All 132 active illustrations cache correctly in the refreshed service worker, with no private invitation/session parameters in the cache.
- Screens with real posters used only the game's existing public poster projection and approved image hosts. Deterministic regression runs also exercised absent and broken posters.
- Screenshots are real browser captures. Testing used Chrome with mobile/touch-sized windows, not a physical Android device.

Publication remains pending explicit authorization after the previous automatic approval review rejected the GitHub push. These changes are local and reviewable; no remote branch, PR or deployment was created.
