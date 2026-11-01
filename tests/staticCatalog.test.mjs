import test from 'node:test';
import assert from 'node:assert/strict';
import {validateStaticMovies,loadStaticCatalog} from '../src/services/staticCatalog.js';
const base={id:'a',title:' Autumn Dreams ',season:'Fall',release_year:2015,verification_status:'verified',story_facts:{setting:['hometown']}};
test('normalizes titles, deduplicates and refuses unsupported seasons',()=>{
 const result=validateStaticMovies({version:1,movies:[base,{...base,id:'b',title:'autumn dreams'},{...base,id:'c',season:'Spring'}]});
 assert.equal(result.length,1);assert.equal(result[0].title,'Autumn Dreams');
});
test('unsubstantiated verification cannot become verified',()=>{
 assert.equal(validateStaticMovies({version:1,movies:[base]})[0].verification_status,'unverified');
});
test('retains source-backed metadata verification without upgrading scene evidence',()=>{
 const sourced={...base,verification_status:'metadata_verified',source_url:'https://www.hallmarkchannel.com/autumn-dreams',facts_status:'title_only_unverified'};
 const [movie]=validateStaticMovies({version:1,movies:[sourced]});
 assert.equal(movie.verification_status,'metadata_verified');
 assert.equal(movie.facts_status,'title_only_unverified');
 assert.deepEqual(movie.story_facts,{setting:['hometown'],relationship:[],conflict:[],event:[]});
});

test('untrusted or unsourced status flags cannot claim verification',()=>{
 for(const source_url of [undefined,'http://example.com/movie','https:///missing-host','javascript:alert(1)']){
  const [movie]=validateStaticMovies({version:1,movies:[{...base,verification_status:'metadata_verified',source_url}]});
  assert.equal(movie.verification_status,'unverified',String(source_url));
 }
 const [legacy]=validateStaticMovies({version:1,movies:[{...base,verification_status:'verified',source_url:'https://www.hallmarkchannel.com/autumn-dreams'}]});
 assert.equal(legacy.verification_status,'unverified');
 const [unverified]=validateStaticMovies({version:1,movies:[{...base,verification_status:'unverified',source_url:'https://www.hallmarkchannel.com/autumn-dreams'}]});
 assert.equal(unverified.verification_status,'unverified');
});

test('scene verification requires explicit scene-level status, not merely a source link',()=>{
 const movie={...base,verification_status:'scene_verified',source_url:'https://www.hallmarkchannel.com/autumn-dreams'};
 assert.equal(validateStaticMovies({version:1,movies:[movie]})[0].verification_status,'unverified');
 assert.equal(validateStaticMovies({version:1,movies:[{...movie,facts_status:'scene_verified'}]})[0].verification_status,'scene_verified');
});

test('keeps different release years and sanitizes story tags',()=>{
 const movies=validateStaticMovies({version:1,movies:[base,{...base,release_year:2020,story_facts:{event:['festival','<script>']}}]});
 assert.equal(movies.length,2);assert.deepEqual(movies[1].story_facts.event,['festival']);
});
test('rejects malformed catalog format',()=>assert.throws(()=>validateStaticMovies({version:2,movies:[]})));

test('loads bundled catalog without Vite runtime globals',async t=>{
 const original=globalThis.fetch;
 t.after(()=>{globalThis.fetch=original});
 let called;
 globalThis.fetch=async (url,opts)=>{called={url,opts};return {ok:true,json:async()=>({version:1,updated_at:'2026-10-26',movies:[base]})}};
 const data=await loadStaticCatalog();
 assert.equal(called.url,'/catalog/movies.json');
 assert.equal(called.opts.cache,'no-cache');
 assert.equal(data.items.length,1);
 assert.equal(data.updatedAt,'2026-10-26');
});


test('static catalog deduplicates punctuation and accent variants but preserves release years',()=>{
 const first={id:'a',title:'Cafe-Noel',season:'Christmas',release_year:2024,
  verification_status:'metadata_verified',source_url:'https://example.com/film'};
 const same={...first,id:'b',title:'Café Noël'};
 const remake={...first,id:'c',title:'Cafe Noel',release_year:2025};
 const movies=validateStaticMovies({version:1,movies:[first,same,remake,{...first,id:'d',title:'!!!'}]});
 assert.deepEqual(movies.map(m=>m.id),['a','c']);
 assert.equal(movies[0].verification_status,'metadata_verified');
});
