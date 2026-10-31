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


## Physical Samsung acceptance and performance capture (pending device results)

The GitHub APK build and JUnit tests do **not** establish that the app runs smoothly on a Samsung. This validation must be performed with a physical phone and a second phone/browser for multiplayer.

1. Install the current **native debug APK** from the [public Android tester prerelease](https://github.com/Moldavite333/Romantiverse-Bingo-App/releases/tag/android-tester) once the release-publishing job has succeeded (or from the authenticated GitHub Actions artifact if the prerelease is not yet available). Enable USB debugging and authorize the computer in the Android developer settings. Install Android platform-tools (adb) and Node 20+ on the computer. Use `adb devices` to verify the phone is connected.
2. Run `node scripts/android-device-perf.mjs --hz 60` from the repository root. The script force-stops and relaunches the app five times, clears prior frame records, then waits while you play for at least 60 seconds. Mark/unmark tiles, finish a Bingo, scroll poster results, switch tabs, and open Together before pressing Enter.
3. The script writes **android-device-performance.json** locally with the phone model, Android version, five relaunch times, median launch time, UI frame-time percentiles, percentage over the specified frame budget, and total PSS memory. Nothing is uploaded. Set `--hz 120` only when evaluating against a 120 Hz budget; 60 Hz remains the launch target. Frame timing is a proxy, **not** proof of 60 displayed frames per second or input latency. No sample means **not validated**, never a pass.
4. Manually verify the actual user experience: legibility of all 25 tiles, mark and win animations, optional haptics, reduced-motion system setting, offline solo play and restored marks after force-stop, share/copy invite link, two different cards in a shared room, synchronized marks, reconnect after airplane mode, and phone rotation. Repeat on a tablet before Play Store approval.
5. Log measured results and reproduction steps for any dropped frames, crashes, clipped UI, lost progress or multiplayer disagreement. Fix and rerun the same scenarios. **Do not mark device/performance acceptance complete until measured physical-device evidence exists.**

This is an internal diagnostics tool, not analytics or a benchmark claim. Force-stop relaunches are not first-install cold starts. Run Android Studio Profiler/Perfetto for deeper traces if the measurements expose jank. The tool never accesses private HQ data.

## Build

With JDK 17, Android SDK 35, and Gradle 8.9 installed:

```bash
gradle -p android :app:testDebugUnitTest :app:assembleDebug
```

The `Native Android build and rules tests` workflow runs the same command and retains a debug APK artifact for seven days. After a successful `main` build, a separate least-privilege job also publishes the APK and its SHA-256 checksum to the [rolling Android tester prerelease](https://github.com/Moldavite333/Romantiverse-Bingo-App/releases/tag/android-tester). The prerelease is a public GitHub Release download, **not** an Actions artifact API link: testers do not need a GitHub account to download it. The publishing job does not run on pull requests. The release must be verified after the workflow finishes; do not claim it exists merely because this configuration is committed.

**Tester installation warning:** CI builds use runner-generated Android debug signing certificates. A later APK may not install over an earlier one; removing the old test app can delete locally saved Bingo cards and marks. This is **not** a production upgrade path. Samsung Auto Blocker and Android's sideloading controls can still block installation; a public download does not bypass device security. A persistent release signing identity and signed AAB remain required for Play Store readiness.

**Brought to you by the Cheese Louise Podcast**
