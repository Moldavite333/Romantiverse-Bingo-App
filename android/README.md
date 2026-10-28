# Romantiverse Bingo — native Android foundation

This is a **native Jetpack Compose Android app**, not a WebView, TWA, or wrapped website. It lives alongside the existing React game without altering the public Cheese Louise website.

## First development slice

- Android 8.0+ (API 26), fully native touch controls and original drawn mountain/poster fallback.
- Offline first launch: the public `public/catalog/movies.json` is packaged directly as an Android asset. Unknown collections remain **Unspecified**, not guessed.
- While online, the app checks the deployed **public** Bingo catalog and caches a validated, non-shrinking update; newly added movies become searchable without reinstalling the APK. If the feed is unavailable, malformed, or smaller than the currently accepted catalog, the bundled/last-known-good catalog remains playable. Deliberate catalog removals require a new app baseline; this conservative rule prevents accidental data loss. The update does not depend on private HQ.
- Native 5×5 deterministic randomized Bingo card, protected free center, mark/undo, 12 winning lines, 100 points per line, local autosave, and independent card seeds.
- Native movie browsing/search and explicit Bingo card theme, separate from the movie's catalog collection.
- Approved-host poster thumbnails from the **public** Bingo cache and the **published-only** HQ poster projection. Exact title + release-year matching; HQ-locked artwork wins. Last known public mapping survives offline use; Coil caches images.
- Motion respects the Android animator-duration accessibility setting; haptics can be disabled.
- Native Play Together host/join flow with a nickname, server-authoritative per-player cards, revision-checked marks, foreground reconnect polling, room preview and host controls.
- Unique room-code-only HTTPS invitation links; native Android clipboard and share sheet, plus selectable-text fallback.
- Movie title, verified catalog collection, poster and independently selected card theme travel with the room. A local private session token is never placed in the invite URL.
- JUnit game-engine and multiplayer-protocol regression tests and GitHub Actions debug APK build.

## Important release gates (NOT complete)

This is an incremental foundation, **not a Play Store release**. The native multiplayer implementation compiles and passes protocol tests; **native-to-native and native-to-web end-to-end testing on real devices is still pending**. Android app-link verification, signed release AAB, Play Store identity and policy declarations, tablet accessibility testing, device performance, and physical Samsung clipboard/share QA are also pending. The Android debug APK is for internal testing only. No login, payments, tracking, or private HQ data.

## Build

With JDK 17, Android SDK 35, and Gradle 8.9 installed:

```bash
gradle -p android :app:testDebugUnitTest :app:assembleDebug
```

The `Native Android build and rules tests` workflow runs the same command and retains a debug APK artifact for seven days.

**Brought to you by the Cheese Louise Podcast**
