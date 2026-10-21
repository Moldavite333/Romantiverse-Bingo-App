import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTitle,matchMovie,candidateQuality,HALLMARK_FEEDS,LISTING_SOURCES} from '../scripts/sources/hallmark-discovery.mjs';
test('normalizes punctuation for title matching',()=>assert.equal(normalizeTitle('Love, Fall & Order!'),'love fall and order'));
test('deduplicates Hallmark titles and detects remakes',()=>{
 const known=[{id:'a',title:'Love, Fall & Order',release_year:2019}];
 assert.equal(matchMovie({title:'Love Fall and Order',year:2019},known).status,'already_cataloged');
 assert.equal(matchMovie({title:'Love, Fall & Order',year:2026},known).status,'possible_remake');
 assert.equal(matchMovie({title:'A New Hallmark Movie',year:2026},known).status,'new_candidate');
});
test('unverified sources always require editorial review',()=>{
 assert.equal(candidateQuality({title:'New Movie',year:2026}).requires_review,true);
 assert.ok(HALLMARK_FEEDS.length>=3&&LISTING_SOURCES.length>=3);
});
