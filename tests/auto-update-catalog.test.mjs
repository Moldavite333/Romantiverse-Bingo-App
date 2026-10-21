import test from 'node:test';import assert from 'node:assert/strict';
import {isHallmarkNetwork,prepareOpenDataMovie,mergeVerifiedNetworkMetadata} from '../scripts/auto-update-catalog.mjs';
const movie={source:'wikidata',source_id:'Q12345',source_url:'https://www.wikidata.org/wiki/Q12345',title:'Christmas in the Valley',release_year:2026,network:'Hallmark Channel',synopsis:'Do not retain this source prose'};
test('only explicitly identified Hallmark networks qualify',()=>{
 assert.equal(isHallmarkNetwork('Hallmark Channel'),true);
 assert.equal(isHallmarkNetwork('Hallmark Mystery'),true);
 assert.equal(isHallmarkNetwork('Hallmark-ish Streaming'),false);
 assert.equal(prepareOpenDataMovie({...movie,network:null}),null);
});
test('does not retain synopsis and does not duplicate title/year',()=>{
 const m=prepareOpenDataMovie(movie);assert.ok(m);assert.ok(!JSON.stringify(m).includes('Do not retain'));
 const base={version:1,movies:[]};
 const once=mergeVerifiedNetworkMetadata(base,[movie,movie]);
 assert.equal(once.added,1);assert.equal(once.catalog.movies.length,1);
 assert.equal(mergeVerifiedNetworkMetadata(once.catalog,[movie]).added,0);
});
