import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeMovieListings} from '../src/engine/movieListings.mjs';

const art=(name)=>'https://image.tmdb.org/t/p/w500/'+name+'.jpg';
const movie=(extras={})=>({id:'catalog-1',title:'Autumn at Apple Hill',release_year:2024,is_demo:false,season:'Fall',synopsis:'The original movie facts',poster_url:art('automatic'),...extras});
const hq=(extras={})=>({id:'hq-1',title:'Autumn at Apple Hill',release_year:2024,is_demo:false,poster_source:'hq_published',poster_locked:true,poster_url:art('hq-locked'),...extras});

test('HQ-locked poster overrides an existing automatic poster but not movie facts',()=>{
 const [merged]=mergeMovieListings([[movie()],[hq()]]);
 assert.equal(merged.poster_url,art('hq-locked'));
 assert.equal(merged.poster_locked,true);
 assert.equal(merged.id,'catalog-1');
 assert.equal(merged.synopsis,'The original movie facts');
 assert.equal(merged.season,'Fall');
});

test('HQ unlocked poster fills missing artwork without changing movie facts',()=>{
 const [merged]=mergeMovieListings([[movie({poster_url:null})],[hq({poster_locked:false})]]);
 assert.equal(merged.poster_url,art('hq-locked'));
 assert.equal(merged.poster_locked,false);
 assert.equal(merged.synopsis,'The original movie facts');
});

test('unlocked HQ poster does not replace existing artwork',()=>{
 const [merged]=mergeMovieListings([[movie()],[hq({poster_locked:false})]]);
 assert.equal(merged.poster_url,art('automatic'));
});

test('poster from a different release year never overrides existing title',()=>{
 const merged=mergeMovieListings([[movie()],[hq({release_year:2023})]]);
 assert.equal(merged.length,2);
 assert.equal(merged[0].poster_url,art('automatic'));
});

test('untrusted poster cannot replace catalog artwork even when claimed locked',()=>{
 const [merged]=mergeMovieListings([[movie()],[hq({poster_url:'https://untrusted.example/poster.jpg'})]]);
 assert.equal(merged.poster_url,art('automatic'));
});

test('HQ-locked poster enriches a curated movie with no is_demo flag when year matches',()=>{
 const curated={id:'curated',title:'Autumn at Apple Hill',release_year:2024,kind:'CHEESE LOUISE CURATED',season:'Fall',story_facts:{setting:['orchard']}};
 const [merged]=mergeMovieListings([[curated],[hq()]]);
 assert.equal(merged.id,'curated');
 assert.equal(merged.poster_url,art('hq-locked'));
 assert.equal(merged.poster_locked,true);
 assert.deepEqual(merged.story_facts,curated.story_facts);
 assert.equal(curated.poster_url,undefined);
});

test('HQ poster never leaks onto explicitly fictional curated demo',()=>{
 const demo={id:'demo',title:'Autumn at Apple Hill',release_year:2024,kind:'DEMO — FICTIONAL'};
 const [merged]=mergeMovieListings([[demo],[hq()]]);
 assert.equal(merged.poster_url,undefined);
});

test('public catalog automatic artwork fills a static title only with exact year and approved host',()=>{
 const bundled={id:'static',title:'Sweet Autumn',release_year:2020,is_demo:false,season:'Fall'};
 const automatic={id:'db',title:'Sweet Autumn',release_year:2020,is_demo:false,poster_source:'catalog_public',poster_url:art('automatic')};
 const [merged]=mergeMovieListings([[bundled],[automatic]]);
 assert.equal(merged.id,'static');
 assert.equal(merged.poster_url,art('automatic'));
 assert.equal(merged.poster_locked,false);
 const wrongYear=mergeMovieListings([[bundled],[{...automatic,release_year:2021}]]);
 assert.equal(wrongYear.length,2);
 assert.equal(wrongYear[0].poster_url,undefined);
 const untrusted=mergeMovieListings([[bundled],[{...automatic,poster_url:'https://attacker.invalid/x.png'}]]);
 assert.equal(untrusted[0].poster_url,undefined);
});

test('HQ-locked artwork overrides a public catalog auto match, while unlocked HQ does not',()=>{
 const staticMovie={id:'static',title:'Sweet Autumn',release_year:2020,is_demo:false,season:'Fall'};
 const auto={title:'Sweet Autumn',release_year:2020,is_demo:false,poster_source:'catalog_public',poster_url:art('auto')};
 const locked={title:'Sweet Autumn',release_year:2020,is_demo:false,poster_source:'hq_published',poster_locked:true,poster_url:art('hq')};
 const unlocked={...locked,poster_locked:false};
 assert.equal(mergeMovieListings([[staticMovie],[auto],[locked]])[0].poster_url,art('hq'));
 assert.equal(mergeMovieListings([[staticMovie],[auto],[unlocked]])[0].poster_url,art('auto'));
});

test('accent variants share a movie identity for exact-year HQ artwork only',()=>{
 const catalog={id:'catalog-cafe',title:'Cafe Noël',release_year:2024,is_demo:false,season:'Christmas',
  poster_url:art('automatic'),story_facts:{event:['holiday_party']}};
 const published={id:'hq-cafe',title:'Café Noël',release_year:2024,is_demo:false,
  poster_source:'hq_published',poster_locked:true,poster_url:art('hq-cafe')};
 const [merged]=mergeMovieListings([[catalog],[published]]);
 assert.equal(merged.id,'catalog-cafe');
 assert.equal(merged.poster_url,art('hq-cafe'));
 assert.equal(merged.poster_locked,true);
 assert.deepEqual(merged.story_facts,catalog.story_facts);
 assert.equal(mergeMovieListings([[catalog],[{...published,release_year:2025}]]).length,2,
  'different-year releases must not share artwork');
 assert.equal(mergeMovieListings([[{...catalog,is_demo:true}],[published]])[0].poster_url,art('automatic'),
  'fictional demos must not inherit HQ artwork');
});


test('HQ-locked poster follows punctuation variants but never a different-year remake',()=>{
 const catalog={id:'catalog',title:'Love-Classified',release_year:2022,is_demo:false,season:'Fall',
  poster_url:art('automatic'),story_facts:{event:['festival']}};
 const published={id:'published',title:'Love, Classified',release_year:2022,is_demo:false,
  poster_source:'hq_published',poster_locked:true,poster_url:art('approved-hq'),notes:'PRIVATE HQ NOTE'};
 const [merged]=mergeMovieListings([[catalog],[published]]);
 assert.equal(merged.id,'catalog');
 assert.equal(merged.poster_url,art('approved-hq'));
 assert.equal(merged.poster_locked,true);
 assert.deepEqual(merged.story_facts,catalog.story_facts);
 assert.equal(merged.notes,undefined,'private HQ metadata must not leak into public listings');
 const remakes=mergeMovieListings([[catalog],[{...published,release_year:2023}]]);
 assert.equal(remakes.length,2);
 assert.equal(remakes[0].poster_url,art('automatic'),'wrong-year HQ poster cannot override original');
});
