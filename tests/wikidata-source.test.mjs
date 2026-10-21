import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWikidataResults,discoverWikidata} from '../scripts/sources/wikidata.mjs';
const example={results:{bindings:[{item:{value:'http://www.wikidata.org/entity/Q123'},itemLabel:{value:'Example Film'},date:{value:'2024-11-12T00:00:00Z'},networkLabel:{value:'Example Channel'}}]}};
test('Wikidata movie leads do not claim a plot synopsis or verified network',()=>{
 const [m]=normalizeWikidataResults(example);assert.equal(m.source_id,'Q123');assert.equal(m.release_year,2024);
 assert.equal(m.synopsis,'');assert.equal(m.suitable_for_auto_import,false);
});
test('Wikidata fetch uses an identified user agent and rejects rate limits',async()=>{
 const [m]=await discoverWikidata({fetcher:async(url,options)=>{assert.match(url,/format=json/);assert.match(options.headers['User-Agent'],/RomantiverseBingo/);return {ok:true,json:async()=>example}}});
 assert.equal(m.title,'Example Film');
 await assert.rejects(discoverWikidata({fetcher:async()=>({ok:false,status:429})}),/429/);
});
