# Native Android art direction — Romantiverse Bingo

## Product direction (approved October 28, 2026)

**Hallmark charm, modern premium game craftsmanship.** Cozy romantic-comedy
storybook scenes, not neon/cyberpunk, monochrome outline icons, casino styling,
or a retro web-page imitation. The artwork should feel like a small-town movie
poster brought to life.

- Warm cream, cranberry, evergreen, muted rose, golden light and soft teal.
- One consistent illustration language: gentle depth, warm lighting, readable
  silhouettes, charming environmental storytelling and restrained detail.
- **Every canonical trope requires its own independent-looking original
  illustration.** A generic heart, sparkle, envelope or leaf reused across
  unrelated tropes is *not* a completed illustration.
- Art is keyed to exact canonical trope labels (or stable future trope IDs),
  never to the shortened visible label, movie, player, card seed or position.
- Offline-first native Compose assets; no remote image dependency and no private
  Cheese Louise HQ assets or data bundled into the app.
- The same illustration must appear in solo and authoritative multiplayer.
  Artwork never changes card identity, marks, scoring, win detection or rooms.
- A 5-column board on a narrow phone is the hard constraint. Favor readable
  composition at ~30dp over intricate but indecipherable details. Keep the
  full canonical text accessible to TalkBack and long-press.
- Unmarked cream tiles use dark text; marked cranberry and winning evergreen
  tiles use light text. Target WCAG AA contrast for small labels.
- Marking a square must **never erase its unique illustration**. The warm-colored
  tile state and a small corner check seal signal marking; solo and multiplayer
  share this behavior. The free center remains a separate branded tile.
- Honor reduced motion. Animation is tasteful and subordinate to gameplay.

## Rollout and honest completion criteria

The native engine currently has **72 distinct selectable trope labels**:
36 Romance, plus 12 each for Christmas, Fall and Horror.

**Phase 4:** all **72 canonical tropes** now have one-to-one native Compose
storybook mini-scenes in `BingoStoryScenes.kt` (36 Romance, 12 Christmas,
12 Fall, 12 Horror). A regression test enforces exact canonical label coverage
and unique scene IDs. The legacy vector fallback remains only for unknown,
future labels until the Android art QA and future-trope policy are finalized.
**This is code coverage, not visual sign-off**: the mini-scenes must still be
reviewed on a real phone at 5-column size for recognizable, independent-looking
art, text legibility, contrast, motion reduction and performance.

**Release gate:** the automated 72-label bijection test is implemented; visual
review of sample cards for every theme, Samsung touch/legibility testing and
tablet/reduced-motion QA are **still required**. Remove the legacy motif
fallback only after that gate passes. New catalog tropes must not silently
reuse another trope's artwork.

The user-approved attribution remains exactly:
**Brought to you by the Cheese Louise Podcast**.
