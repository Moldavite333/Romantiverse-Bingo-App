# Facts-only movie intelligence and copyright/access guardrails

**Brought to you by the Cheese Louise Podcast**

## Core approach
Read a description only from a source we may lawfully access and process. Analyze it in memory, extract a controlled vocabulary of story facts, and discard the original prose. Store movie title, year, source reference, season, and short machine-generated fact tags. The game selects original Cheese Traits and seasonal Bingo squares using those facts. Do not store source descriptions, screenshots, promotional images, or source-specific expressive phrasing.

**This is risk reduction, not a blanket legal exemption.** Copyright, website terms, access restrictions, database rights in some jurisdictions, privacy, attribution and licensing can apply independently. No technical measure guarantees freedom from legal claims.

## Import
For an authorized editorial input, supply `source`, `access_basis`, and `movies` with `title`, `season`, and either `synopsis` (transient input only) or `story_facts`. `scripts/merge-catalog.mjs` strips the synopsis before writing. Check source terms and rights first. Never bypass anti-bot controls, logins or paywalls.

## Card creation
The browser engine uses title and normalized fact tags; cards remain fully functional when no description exists, with lower-confidence genre predictions. A player may enter their own movie title and optionally a description they are authorized to provide; its text is used only for local analysis. Observed scenes are always marked by the player, never claimed to be AI-verified.

## Current limits
Weekly research artifacts contain source links and review checklists; they do not automatically extract Hallmark website text. To automate new-title discovery, use an API/feed whose access rules allow the intended requests. Our rules are heuristic and should be measured for card quality and win rates.
