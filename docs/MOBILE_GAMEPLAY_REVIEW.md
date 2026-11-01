# Shared Bingo playability review — November 1, 2026

The reported failure occurred in **Play Together** after switching apps/windows on mobile. The previous client saved only a room token in sessionStorage; it did not keep a local room/card/mark snapshot, restore the shared-game screen on root reload, or reconnect immediately on visibility/focus/online/pageshow. Its history only listed completed solo games. An interrupted background read could also block later polling until its timeout.

## Changes

- Save existing guest identity plus the exact card, confirmed marks, revision, room metadata and save time on this device. Keep the five most recently observed shared games. Migrate old per-tab credentials when they remain available. Preserve an existing tab's own room while allowing a new/recreated window to recover the active game from durable storage.
- Show **Your saved games** on Discover and Cheese Tray before a movie ends. Resume the same player with a state read, never a replacement join or deal. Finished rooms remain locally reviewable after server expiry. Credentials already erased before this fix cannot be reconstructed.
- Display the cached card immediately while offline/reconnecting. Disable new marks until server state is confirmed; never pretend unconfirmed taps were saved. Report actual device-storage failures.
- Abort superseded reads and reconnect on visibility, focus, pageshow and restored connectivity. Ignore late responses and retain monotonic confirmed revisions. Keep writes single-attempt. Prevent late polls from moving a room backward from finished to playing, including in saved history.
- Serialize rapid taps and undo using the latest confirmed server revision. The previous early-return guard silently ignored taps while a mark was saving. Show pending-tap feedback; if a write is uncertain, clear the unsent queue, read state, and explain which taps need checking rather than retrying toggles automatically.
- Show start/end controls only to the actual host. The server remains authoritative. Confirm leaving or ending a shared game, and retain the completed card and marks in saved games.
- Scroll to the card when it first becomes available; provide **Back to my card**, collapse invitation details while playing, and show marked count, completed lines, and distance to the next line or blackout near the board.

## Verification

268 Node regression tests pass, including memory migration, simulated tab loss, identical card/player restoration, stale snapshot protection, multi-window active-room isolation, corrupt/full storage, reconnect lifecycle, cancelled reads and serialized taps/undo without retrying uncertain writes.

The mobile/desktop host-and-guest browser fixture plays a complete flow: create/join, invitation/copy/share behavior, host start, five-in-a-row, independent guest marks, reduced motion, cleared sessionStorage, opening a new window, cached offline restore, immediate online recovery, rapid taps and undo against delayed responses, reload, resuming an unfinished game from Cheese Tray, cancelled/confirmed ending and review of the completed game. It asserts only one original create and join occurred during recovery and that private tokens never appear in the UI. The general browser suite additionally covers 320/390/1440 px layouts, keyboard marking, solo invitations/autosave, catalogs, HQ poster precedence and public metadata isolation. Artwork browser checks cover six theme/viewport combinations and all selected/winning states.

Screenshot evidence: `artifacts/artwork/mobile-room-resumed.png`, `multiplayer-mobile-winning.png`, `multiplayer-desktop-guest.png`, and the Christmas/Fall card pages. These are automated Chromium/mobile-emulation checks, not a claim of physical-device certification.

No Android source, multiplayer server source, card dealing, scoring rules, HQ private data permissions, or cocktail matching code was changed. Clearing this site's browser storage still removes device-only recovery, and live rooms retain their existing 12-hour lifetime. The existing real-room post-deployment gate verifies two independent players, invitation metadata, marking, authorization and finish on the public game API.
