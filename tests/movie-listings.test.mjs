import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeMovieListings,movieEvidenceLabel} from '../src/engine/movieListings.mjs';

test('bundled and Supabase versions of the same movie appear only once',()=>{
 const staticTitle={id:'static',title:'Autumn at Apple Hill',release_year:2024,is_demo:false};
 const remoteTitle={id:'supabase',title:' autumn   AT apple hill ',release_year:2024,is_demo:false};
 assert.deepEqual(mergeMovieListings([[staticTitle],[remoteTitle]]),[staticTitle]);
});
test('user-curated titles take priority without exposing or mutating the source',()=>{
 const curated={id:'curated',title:'Love, Fall & Order',kind:'CHEESE LOUISE CURATED'};
 const catalog={id:'catalog',title:'Love, Fall & Order',release_year:2019,is_demo:false};
 assert.deepEqual(mergeMovieListings([[curated],[catalog]]),[curated]);
 assert.equal(curated.is_demo,undefined);
});
test('same-title remakes with different known years stay independently playable',()=>{
 const first={title:'The Holiday',release_year:2006},second={title:'The Holiday',release_year:2025};
 assert.deepEqual(mergeMovieListings([[first,second]]),[first,second]);
});
test('missing title entries are skipped and source groups may be absent',()=>{
 assert.deepEqual(mergeMovieListings([null,[null,{title:'   '},{title:'Valid'}]]),[{title:'Valid'}]);
});
test('catalog labels distinguish demos, real titles, curated and custom movies',()=>{
 assert.equal(movieEvidenceLabel({kind:'CHEESE LOUISE CURATED'}),'CHEESE LOUISE CURATED · SCENES UNVERIFIED');
 assert.equal(movieEvidenceLabel({kind:'CUSTOM'}),'CUSTOM TITLE · SCENES UNVERIFIED');
 assert.equal(movieEvidenceLabel({kind:'PUBLIC MOVIE SEARCH · SCENES UNVERIFIED',is_demo:false}),'PUBLIC SEARCH · TITLE UNVERIFIED');
 assert.equal(movieEvidenceLabel({is_demo:false}),'REAL TITLE · TROPES PREDICTED');
 assert.equal(movieEvidenceLabel({kind:'DEMO — FICTIONAL'}),'FICTIONAL DEMO');
 assert.equal(movieEvidenceLabel({}),'TITLE UNVERIFIED');
});

test('a later rights-cleared poster enriches an exact real movie match without replacing its facts',()=>{
 const base={id:'static',title:'Autumn at Apple Hill',release_year:2024,is_demo:false,season:'Fall',story_facts:{setting:['orchard']}};
 const enriched={id:'remote',title:'AUTUMN AT APPLE HILL',release_year:2024,is_demo:false,season:'Christmas',poster_url:'https://image.tmdb.org/t/p/w500/apple.jpg',poster_rights:{status:'approved',credit:'Cleared image'}};
 const result=mergeMovieListings([[base],[enriched]]);
 assert.equal(result.length,1);
 assert.equal(result[0].id,'static');
 assert.equal(result[0].season,'Fall');
 assert.deepEqual(result[0].story_facts,base.story_facts);
 assert.equal(result[0].poster_url,enriched.poster_url);
 assert.equal(base.poster_url,undefined,'Source objects are never mutated');
});
test('unapproved poster URLs and ambiguous remakes never enrich selected titles',()=>{
 const base={id:'curated',title:'The Holiday',is_demo:false};
 const other={id:'remote',title:'The Holiday',release_year:2024,is_demo:false,poster_url:'https://image.tmdb.org/t/p/w500/other.jpg',poster_rights:{status:'approved',credit:'Cleared'}};
 assert.deepEqual(mergeMovieListings([[base],[other]]),[base]);
 const known={...base,release_year:2024};
 const unapproved={...other,poster_rights:undefined};
 assert.deepEqual(mergeMovieListings([[known],[unapproved]]),[known]);
});
