import test from 'node:test';
import assert from 'node:assert/strict';
import {lookupTVmaze,reviewCandidate} from '../scripts/sources/tvmaze.mjs';
test('normalizes TVmaze leads but never auto-imports them',async()=>{
 const fetcher=async url=>{assert.match(url,/search\/shows\?q=/);return {ok:true,json:async()=>[{show:{id:42,name:'Autumn Dreams',type:'Scripted',premiered:'2015-01-01',summary:'<p>A <b>romance</b> story.</p>',network:{name:'Some Network'},url:'https://www.tvmaze.com/shows/42/example'}}]}};
 const [lead]=await lookupTVmaze('Autumn Dreams',{fetcher});
 assert.equal(lead.synopsis,'A romance story.');
 assert.equal(lead.editorial_status,'review_required');
 const checked=reviewCandidate(lead,{expectedTitle:'Autumn Dreams',expectedYear:2015});
 assert.equal(checked.title_match,true);assert.equal(checked.suitable_for_auto_import,false);
});
test('rejects malformed or failed provider responses',async()=>{
 await assert.rejects(lookupTVmaze('ab'),/3–120/);
 await assert.rejects(lookupTVmaze('a title',{fetcher:async()=>({ok:false,status:429})}),/429/);
});
