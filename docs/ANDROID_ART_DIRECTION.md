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
- Honor reduced motion. Animation is tasteful and subordinate to gameplay.

## Rollout and honest completion criteria

The native engine currently has **72 distinct selectable trope labels**:
36 Romance, plus 12 each for Christmas, Fall and Horror.

**Phase 2:** 40 independent Compose story scenes are in `BingoStoryScenes.kt`:
all 36 Romance tropes plus 4 Christmas tropes. The other 32 seasonal labels
(8 Christmas, 12 Fall, 12 Horror) temporarily use the legacy vector fallback
in `BingoTropeArtwork.kt`. This is a transitional implementation, not final
approval of generic icons.

**Release gate:** every one of the 72 engine tropes must have a distinct scene,
with an automated bijection test, visual review of a sample card for every
theme, Samsung touch/legibility testing, and tablet/reduced-motion QA. Remove
the legacy motif fallback only after that gate passes. New catalog tropes must
not silently reuse another trope's artwork.

The user-approved attribution remains exactly:
**Brought to you by the Cheese Louise Podcast**.
