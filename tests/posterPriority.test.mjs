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
