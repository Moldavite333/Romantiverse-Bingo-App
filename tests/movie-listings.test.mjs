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
