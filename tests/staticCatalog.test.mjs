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
