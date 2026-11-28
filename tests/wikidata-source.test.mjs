import test from 'node:test';
import assert from 'node:assert/strict';
import {PROVIDER_QUERY,providerQuery,normalizeWikidataResults,discoverWikidata} from '../scripts/sources/wikidata.mjs';
const example={results:{bindings:[{item:{value:'http://www.wikidata.org/entity/Q123'},itemLabel:{value:'Example Film'},date:{value:'2024-11-12T00:00:00Z'},networkLabel:{value:'Example Channel'}}]}};
const provider=(id,name,kind)=>({provider:{value:'http://www.wikidata.org/entity/'+id},name:{value:name},kind:{value:kind}});
const respond=(url,providers=[provider('Q1','Hallmark Channel','network')])=>({
 ok:true,json:async()=>decodeURIComponent(url).includes(PROVIDER_QUERY)?{results:{bindings:providers}}:example
});
test('Wikidata movie leads do not claim a plot synopsis or verified network',()=>{
 const [m]=normalizeWikidataResults(example);assert.equal(m.source_id,'Q123');assert.equal(m.release_year,2024);
 assert.equal(m.synopsis,'');assert.equal(m.suitable_for_auto_import,false);
});
test('Wikidata fetch uses an identified user agent and rejects rate limits',async()=>{
 const [m]=await discoverWikidata({fetcher:async(url,options)=>{assert.match(url,/format=json/);assert.match(options.headers['User-Agent'],/RomantiverseBingo/);return respond(url)}});
 assert.equal(m.title,'Example Film');
 await assert.rejects(discoverWikidata({fetcher:async()=>({ok:false,status:429}),sleep:async()=>{}}),/429/);
});

test('release-year discovery uses first release and collapses later rebroadcast dates',()=>{
 assert.ok(providerQuery('Q1','network').includes('MIN(?released)'));
 assert.match(providerQuery('Q1','network'),/2000-01-01/);
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
 assert.match(PROVIDER_QUERY,/Lifetime Movie Network/);
 assert.match(PROVIDER_QUERY,/"Lifetime"@en/);
 assert.match(PROVIDER_QUERY,/"MarVista Entertainment"@en/);
 assert.match(PROVIDER_QUERY,/"Reel One Entertainment"@en/);
 assert.match(providerQuery('Q1','network'),/wdt:P449 wd:Q1/);
 assert.match(providerQuery('Q2','company'),/wdt:P272 wd:Q2/);
 assert.match(providerQuery('Q2','company'),/wd:Q506240/);
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

test('temporary rate limits retry once after the requested short cooldown',async()=>{
 let calls=0;const waits=[];
 const result=await discoverWikidata({
  fetcher:async url=>{
   calls++;
   return calls===1
    ?{ok:false,status:429,headers:{get:()=> '2'}}
    :respond(url);
  },
  sleep:async ms=>{waits.push(ms);}
 });
 assert.equal(calls,3);
 assert.deepEqual(waits,[2000]);
 assert.equal(result[0].source_id,'Q123');
});

test('transient service errors retry only once and permanent failures never retry',async()=>{
 let attempts=0;
 await assert.rejects(discoverWikidata({
  fetcher:async()=>{attempts++;return {ok:false,status:503};},
  sleep:async ms=>{assert.equal(ms,1500);}
 }),/503/);
 assert.equal(attempts,2);
 attempts=0;
 await assert.rejects(discoverWikidata({
  fetcher:async()=>{attempts++;return {ok:false,status:400};},
  sleep:async()=>{throw Error('Must not sleep for permanent failure');}
 }),/400/);
 assert.equal(attempts,1);
});

test('long Retry-After defers to a future run rather than hammering Wikidata',async()=>{
 let attempts=0;
 await assert.rejects(discoverWikidata({
  fetcher:async()=>{attempts++;return {ok:false,status:429,headers:{get:()=> '90'}};},
  sleep:async()=>{throw Error('Long cooldown must not be ignored');}
 }),/Retry-After exceeds bounded retry window/);
 assert.equal(attempts,1);
});

test('HTTP-date Retry-After is respected without real waiting',async()=>{
 const waits=[];
 await discoverWikidata({
  fetcher:(()=>{let count=0;return async url=>++count===1
   ?{ok:false,status:503,headers:{get:()=> 'Sat, 31 Oct 2026 12:00:05 GMT'}}
   :respond(url);})(),
  now:()=>Date.parse('2026-10-31T12:00:00Z'),
  sleep:async ms=>{waits.push(ms);}
 });
 assert.deepEqual(waits,[5000]);
});

test('temporary network timeouts retry once without duplicating discovery',async()=>{
 let attempts=0;const waits=[];
 const films=await discoverWikidata({
  fetcher:async url=>{
   attempts++;
   if(attempts===1)throw new Error('temporary timeout');
   return respond(url);
  },
  sleep:async ms=>waits.push(ms)
 });
 assert.equal(attempts,3);
 assert.deepEqual(waits,[1500]);
 assert.equal(films.length,1);
 attempts=0;
 await assert.rejects(discoverWikidata({
  fetcher:async()=>{attempts++;throw new Error('service unavailable');},
  sleep:async()=>{}
 }),/after bounded attempts/);
 assert.equal(attempts,2);
});

test('provider partitions preserve broadcaster and production evidence for the same film',async()=>{
 const films=await discoverWikidata({fetcher:async url=>respond(url,[
  provider('Q1','Hallmark Channel','network'),provider('Q2','MarVista Entertainment','company')
 ])});
 assert.equal(films.length,1);
 assert.equal(films[0].network,'Hallmark Channel');
 assert.equal(films[0].production_company,'MarVista Entertainment');
 assert.equal(films[0].tv_film_evidence,true);
});

test('a failed provider partition rejects the whole refresh',async()=>{
 await assert.rejects(discoverWikidata({fetcher:async url=>decodeURIComponent(url).includes('wd:Q2')
  ?{ok:false,status:400}:respond(url,[provider('Q1','Hallmark Channel','network'),provider('Q2','MarVista Entertainment','company')])
 }),/Wikidata returned 400/);
});
