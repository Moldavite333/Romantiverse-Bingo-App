# Hallmark-first weekly discovery

**Brought to you by the Cheese Louise Podcast**

## Priorities
1. Official Hallmark Channel schedule: https://www.hallmarkchannel.com/schedule
2. TV Insider schedule: https://www.tvinsider.com/network/hallmark-channel/schedule/
3. TV Passport listings: https://www.tvpassport.com/tv-listings/stations/hallmark-channel-hd-eastern/6213
4. Hallmark premiere announcements and entertainment coverage, linked through curated search URLs.
5. Wikidata and TVmaze as supplemental discovery only; neither is comprehensive for Hallmark TV movies.

## Weekly process
A scheduled GitHub Action creates a review artifact with source links, existing movies, and metadata gaps. It makes **no requests to Hallmark or third-party listing sites**. An editor checks the schedules and premiere announcements, records verified metadata and a permitted or original synopsis, and imports through `scripts/merge-catalog.mjs`. The app then generates predictions locally, without an AI bill.

## Why not automatically scrape TV Insider or TV Passport?
Public viewing access does not establish automated harvesting or republication rights. If an authorized listing-data API or license is secured, implement a narrowly scoped adapter with caching, quotas, deduplication, source attribution and approval gating. Until then, do not automatically ingest copyrighted listings or synopses.

## Future improvement
If a permitted machine-readable source is available, automate discovery and generate a pull request with source provenance and confidence flags. Keep human review for ambiguous matches and third-party synopsis reuse. Distinguish premiere date from rerun airdate; one movie may appear many times per week.
