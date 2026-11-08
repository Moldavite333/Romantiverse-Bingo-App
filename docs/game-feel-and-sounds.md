# Movie-night game feel and royalty-free sound

The Bingo board now reveals in five staggered columns, stamps marked squares and shows the real distance to the closest winning line. Confirmed Bingo and blackout results get a short musical cue and a warm gold/coral star shower. Replay reveal animates the existing card; it does not reroll tropes or change marks. Multiplayer sounds follow confirmed server marks, not queued taps.

Sound starts off, has a visible toggle and remembers the device's choice. Restoring a game or reopening the page never starts audio. Browsers require user interaction before sound can play. Hiding the page or muting cancels current notes; unavailable audio leaves the game playable. Reduced-motion settings remove reel, stamp and celebration animations.

## Selected sources

| Pack | Use | License |
| --- | --- | --- |
| [Kenney Casino Audio](https://kenney.nl/assets/casino-audio) | Chip placement, card slide, shuffle | CC0 |
| [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds) | Confirmation / one-square-away cue | CC0 |
| [Kenney Music Jingles](https://kenney.nl/assets/music-jingles) | Pizzicato Bingo and blackout stingers | CC0 |

All six original recordings total **83,600 bytes**. They were downloaded through the author's official download service, checked against the included licenses and renamed without recompression. Exact names, source links and SHA-256 values are in `public/audio/provenance.json`. Original licenses and credit are included in `public/audio/`. CC0 permits commercial use, modification and redistribution without mandatory attribution: https://creativecommons.org/publicdomain/zero/1.0/

Additional researched options:

- [Ash Born Interactive Slot Machine Sound Effects](https://joelheath42.itch.io/slot-machine-sound-effects): two actual reel sounds, including a win ending. The author allows commercial use and edits and requests credit to Ash Born Interactive. Not bundled.
- [Freesound slot-machine reels by aghirlandaio](https://freesound.org/people/aghirlandaio/sounds/415074/): listed as CC0, approximately 27 seconds, login required for the original download. Not bundled.
- [Mixkit slot-machine effects](https://mixkit.co/free-sound-effects/slot-machine/): royalty-free commercial game use is allowed, but the [license](https://mixkit.co/license/modal/sfxFree/) prohibits redistribution with source files. Not bundled into this public repository.

## Validation

- 286 unit tests pass, including real goal-aware cue decisions, blackout behavior, mute cancellation, unavailable API/storage fallback and exact CC0 asset provenance.
- Five-size browser review at 320/360/390/430/1440px verifies native Web Audio playback, all six recorded samples decoding, silent default/restoration, preference persistence, unchanged cards on replay, real win cues and reduced-motion behavior. Failed recording requests fall back to original synthesized tones; an unavailable Web Audio API keeps the game playable.
- Existing multiplayer, offline, design and complete illustration inventory checks pass. All six recordings are precached and decode after an offline reload. No private credentials or room state enter that cache.
- Source gameplay rules, artwork, approved emblem, canonical trope identities, scoring, private HQ data and Android source are unchanged.

Screenshots and the browser report are saved under `artifacts/game-feel/`. Audio remains dependent on browser/device playback policies; the muted-by-default experience and visual feedback work without it.
