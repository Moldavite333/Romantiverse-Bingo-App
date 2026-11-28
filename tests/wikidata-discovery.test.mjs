import test from 'node:test';import assert from 'node:assert/strict';
import {PROVIDER_QUERY,providerQuery,normalizeWikidataResults} from '../scripts/sources/wikidata.mjs';
test('Wikidata search is network-targeted rather than globally latest films',()=>{
 assert.match(PROVIDER_QUERY,/Hallmark Channel/);
 const query=providerQuery('Q641746','network');
 assert.match(query,/wdt:P449 wd:Q641746/);
 assert.match(query,/LIMIT 500/);
});
test('normalizes Hallmark records without importing synopsis prose',()=>{
 const data={results:{bindings:[{item:{value:'https://www.wikidata.org/entity/Q123'},itemLabel:{value:'A Fall Romance'},date:{value:'2026-10-01T00:00:00Z'},networkLabel:{value:'Hallmark Channel'},itemDescription:{value:'copyrighted source expression'}}]}};
 const result=normalizeWikidataResults(data);
 assert.equal(result.length,1);assert.equal(result[0].network,'Hallmark Channel');assert.equal(result[0].release_year,2026);
 assert.equal(result[0].synopsis,'');
});
