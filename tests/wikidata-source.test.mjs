import test from 'node:test';
import assert from 'node:assert/strict';
import {QUERY,normalizeWikidataResults,discoverWikidata} from '../scripts/sources/wikidata.mjs';
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

test('release-year discovery uses first release and collapses later rebroadcast dates',()=>{
 assert.ok(QUERY.includes('MIN(?released)'));
 assert.match(QUERY,/2000-01-01/);
 const binding=(date)=>({
  item:{value:'http://www.wikidata.org/entity/Q123'},
  itemLabel:{value:'Example Film'},
  date:{value:date+'-11-12T00:00:00Z'},
  networkLabel:{value:'Hallmark Channel'}
 });
 const movies=normalizeWikidataResults({results:{bindings:[binding(2023),binding(2018),binding(2020)]}});
 assert.equal(movies.length,1);
 assert.equal(movies[0].release_year,2018);
 assert.equal(movies[0].source_id,'Q123');
});

test('Wikidata discovery scopes Lifetime broadcasts and MarVista/Reel One to TV films',()=>{
 assert.match(QUERY,/Lifetime Movie Network/);
 assert.match(QUERY,/"Lifetime"@en/);
 assert.match(QUERY,/"MarVista Entertainment"@en/);
 assert.match(QUERY,/"Reel One Entertainment"@en/);
 assert.match(QUERY,/wdt:P449/); // Original broadcaster, not any later channel.
 assert.match(QUERY,/wdt:P272/); // Production company.
 assert.match(QUERY,/wd:Q506240/); // Made-for-TV only on producer branch.
 assert.match(QUERY,/SAMPLE\(\?tvFilmType\)/);
 assert.match(QUERY,/MIN\(\?released\)/);
});
test('producer-only leads carry TV-film evidence without inventing a broadcaster',()=>{
 const binding={item:{value:'http://www.wikidata.org/entity/Q888'},
  itemLabel:{value:'A Movie Night'},date:{value:'2025-10-01T00:00:00Z'},
  productionCompanyLabel:{value:'Reel One Entertainment'},
  tvFilmEvidence:{value:'television film'}};
 const [lead]=normalizeWikidataResults({results:{bindings:[binding]}});
 assert.equal(lead.network,null);
 assert.equal(lead.production_company,'Reel One Entertainment');
 assert.equal(lead.tv_film_evidence,true);
 assert.equal(lead.release_year,2025);
});
test('duplicate Wikidata releases preserve source evidence and earliest year',()=>{
 const base={item:{value:'http://www.wikidata.org/entity/Q777'},itemLabel:{value:'The Movie'}};
 const [lead]=normalizeWikidataResults({results:{bindings:[
  {...base,date:{value:'2023-12-01T00:00:00Z'},networkLabel:{value:'Lifetime'}},
  {...base,date:{value:'2019-01-01T00:00:00Z'},productionCompanyLabel:{value:'MarVista Entertainment'},
   tvFilmEvidence:{value:'television film'}}
 ]}});
 assert.equal(lead.release_year,2019);
 assert.equal(lead.network,'Lifetime');
 assert.equal(lead.production_company,'MarVista Entertainment');
 assert.equal(lead.tv_film_evidence,true);
});
