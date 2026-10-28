# Romantiverse Bingo — native Android foundation

This is a **native Jetpack Compose Android app**, not a WebView, TWA, or wrapped website. It lives alongside the existing React game without altering the public Cheese Louise website.

## First development slice

- Android 8.0+ (API 26), fully native touch controls and original drawn mountain/poster fallback.
- Offline first launch: the public `public/catalog/movies.json` is packaged directly as an Android asset. Unknown collections remain **Unspecified**, not guessed.
- Native 5×5 deterministic randomized Bingo card, protected free center, mark/undo, 12 winning lines, 100 points per line, local autosave, and independent card seeds.
- Native movie browsing/search and explicit Bingo card theme, separate from the movie's catalog collection.
- Approved-host poster thumbnails from the **public** Bingo cache and the **published-only** HQ poster projection. Exact title + release-year matching; HQ-locked artwork wins. Last known public mapping survives offline use; Coil caches images.
- Motion respects the Android animator-duration accessibility setting; haptics can be disabled.
- JUnit game-engine regression tests and GitHub Actions debug APK build.

## Important release gates (NOT complete)

This is an incremental foundation, **not a Play Store release**. Native authoritative Play Together, room reconnect/invites, signed release AAB, Play Store identity and policy declarations, tablet accessibility testing, device performance, and physical Samsung QA are still pending. The Android debug APK is for internal testing only. No login, payments, tracking, or private HQ data.

## Build

With JDK 17, Android SDK 35, and Gradle 8.9 installed:

```bash
gradle -p android :app:testDebugUnitTest :app:assembleDebug
```

The `Native Android build and rules tests` workflow runs the same command and retains a debug APK artifact for seven days.

**Brought to you by the Cheese Louise Podcast**
