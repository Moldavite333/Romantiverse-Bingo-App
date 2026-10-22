import test from 'node:test';import assert from 'node:assert/strict';
import {QUERY,normalizeWikidataResults} from '../scripts/sources/wikidata.mjs';
test('Wikidata search is network-targeted rather than globally latest films',()=>{
 assert.match(QUERY,/Hallmark Channel/);
 assert.match(QUERY,/wdt:P449/);
 assert.match(QUERY,/LIMIT 500/);
 assert.doesNotMatch(QUERY,/LIMIT 100\b/);
});
test('normalizes Hallmark records without importing synopsis prose',()=>{
 const data={results:{bindings:[{item:{value:'https://www.wikidata.org/entity/Q123'},itemLabel:{value:'A Fall Romance'},date:{value:'2026-10-01T00:00:00Z'},networkLabel:{value:'Hallmark Channel'},itemDescription:{value:'copyrighted source expression'}}]}};
 const result=normalizeWikidataResults(data);
 assert.equal(result.length,1);assert.equal(result[0].network,'Hallmark Channel');assert.equal(result[0].release_year,2026);
 assert.equal(result[0].synopsis,'');
});
