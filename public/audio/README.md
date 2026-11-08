# Romantiverse Bingo sound effects

Creators: **Kenney Vleugels / Kenney.nl** (five recordings) and **Romantiverse Bingo project** (original electronic jackpot cue). All six audio assets are released under **CC0 1.0 Universal**. They may be used, modified and distributed in personal and commercial projects. Attribution is not mandatory; we preserve credit and license provenance anyway.

| App event | Original file | Source |
| --- | --- | --- |
| Mark | `chip-lay-1.ogg` | [Casino Audio](https://kenney.nl/assets/casino-audio) |
| Undo | `card-slide-1.ogg` | [Casino Audio](https://kenney.nl/assets/casino-audio) |
| Card reveal | `card-shuffle.ogg` | [Casino Audio](https://kenney.nl/assets/casino-audio) |
| One square away | `confirmation_002.ogg` | [Interface Sounds](https://kenney.nl/assets/interface-sounds) |
| Bingo | `win-jackpot.wav` | Original electronic jackpot; source: `scripts/generate-jackpot.mjs` |
| Blackout | `jingles_PIZZI10.ogg` | [Music Jingles](https://kenney.nl/assets/music-jingles) |

The five Kenney files were renamed only; original OGG bytes were preserved. The jackpot is a reproducible original 5.2-second electronic composition: rising arpeggios, bright anticipatory accents and a sustained major-sixth win chord. It contains no brass, coins or third-party samples. Per-file SHA-256 values are in `provenance.json`. Kenney's original pack licenses are preserved as `LICENSE-casino.txt`, `LICENSE-interface.txt` and `LICENSE-jingles.txt`; the original jackpot dedication is `LICENSE-jackpot.txt`.

License: https://creativecommons.org/publicdomain/zero/1.0/

No Mixkit or Freesound recordings are bundled. Mixkit's sound-effects license allows commercial games but prohibits distributing items with source files, which makes it unsuitable for bundling into this public source repository.

Playback is opt-in and uses the browser's Web Audio API. The app keeps short synthesized tones as a fallback when recordings cannot be fetched or decoded. These original synthesized cues use no third-party samples. Sound assets are available through the public-only offline cache; private game/session data is never cached there.
