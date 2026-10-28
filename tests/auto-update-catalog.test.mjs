import test from 'node:test';import assert from 'node:assert/strict';
import {isHallmarkNetwork,seasonalThemeFromTitle,prepareOpenDataMovie,mergeVerifiedNetworkMetadata} from '../scripts/auto-update-catalog.mjs';
const movie={source:'wikidata',source_id:'Q12345',source_url:'https://www.wikidata.org/wiki/Q12345',title:'Christmas in the Valley',release_year:2026,network:'Hallmark Channel',synopsis:'Do not retain this source prose'};
test('only explicitly identified Hallmark networks qualify',()=>{
 assert.equal(isHallmarkNetwork('Hallmark Channel'),true);
 assert.equal(isHallmarkNetwork('Hallmark Mystery'),true);
 assert.equal(isHallmarkNetwork('Hallmark-ish Streaming'),false);
 assert.equal(prepareOpenDataMovie({...movie,network:null}),null);
});
test('does not retain synopsis and does not duplicate title/year',()=>{
 const m=prepareOpenDataMovie(movie);assert.ok(m);assert.ok(!JSON.stringify(m).includes('Do not retain'));
 assert.equal(m.id,'wikidata-q12345');
 assert.match(m.id,/^[a-z0-9][a-z0-9-]{0,119}$/);
 const base={version:1,movies:[]};
 const once=mergeVerifiedNetworkMetadata(base,[movie,movie]);
 assert.equal(once.added,1);assert.equal(once.catalog.movies.length,1);
 assert.equal(mergeVerifiedNetworkMetadata(once.catalog,[movie]).added,0);
});

test('seasonal classification never defaults an unknown movie to Christmas',()=>{
 assert.equal(seasonalThemeFromTitle('Christmas in the Valley'),'Christmas');
 assert.equal(seasonalThemeFromTitle('The Autumn Promise'),'Fall');
 assert.equal(seasonalThemeFromTitle('Pumpkin Pie Wars'),'Fall');
 assert.equal(seasonalThemeFromTitle('A Winter Wedding'),null);
 assert.equal(seasonalThemeFromTitle('A Holiday Abroad'),null);
 assert.equal(seasonalThemeFromTitle('Love at First Sight'),null);
 assert.equal(seasonalThemeFromTitle('Fall for You'),null);
 assert.equal(seasonalThemeFromTitle('Christmas Harvest'),null);
});
test('scheduled import keeps network-qualified unknown-season titles without fabricating a season',()=>{
 const unclassified={...movie,source_id:'Q12346',title:'A Winter Wedding'};
 const unknown=prepareOpenDataMovie(unclassified);
 assert.equal(unknown.season,'Unspecified');
 assert.equal(unknown.verification_status,'unverified');
 assert.equal(unknown.facts_status,'title_only_unverified');
 assert.ok(!JSON.stringify(unknown).includes('Do not retain'));
 const fall={...movie,source_id:'Q12347',title:'Autumn in the Valley'};
 assert.equal(prepareOpenDataMovie(fall).season,'Fall');
 const result=mergeVerifiedNetworkMetadata({version:1,movies:[]},[unclassified,fall,movie]);
 assert.equal(result.added,3);
 assert.deepEqual(result.catalog.movies.map(m=>m.season).sort(),['Christmas','Fall','Unspecified']);
 assert.equal(mergeVerifiedNetworkMetadata(result.catalog,[unclassified]).added,0);
});
