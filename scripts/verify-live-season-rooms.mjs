// Real public rooms only. Tokens remain in memory and are never logged or saved.
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolveIllustration} from '../src/engine/illustrationRegistry.mjs';
const endpoint='https://yxpamyibhclilgdhgsjd.supabase.co/functions/v1/game-room';
async function post(action,payload){const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://bingo.cheeselouisepod.com'},body:JSON.stringify({action,...payload}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error(action+' HTTP '+r.status);return r.json()}
const results=[];
for(const season of ['Spring','Summer','Romance']){
 const host=await post('create',{name:'Season QA Host',movie_title:'Season Expansion Verification',movie_collection:'Unspecified',season,mode:'classic'});
 try{
  const guest=await post('join',{code:host.room.code,name:'Season QA Guest'});
  assert.equal(host.room.season,season);assert.equal(guest.room.season,season);assert.equal(host.room.movie_collection,'Unspecified');
  assert.notDeepEqual(host.card,guest.card);for(const card of [host.card,guest.card]){assert.equal(card.length,25);assert.equal(new Set(card.map(t=>t.label)).size,25);for(const t of card)assert.ok(resolveIllustration(t),t.label);if(season==='Romance')assert.ok(card.every(t=>t.category!=='seasonal'))}
  await post('start',{code:host.room.code,token:host.token});
  let revision=guest.revision,last;
  for(const index of [0,1,2,3,4]){last=await post('mark',{code:host.room.code,token:guest.token,index,revision});revision=last.revision}
  assert.equal(last.score.bingo,true);const state=await post('state',{code:host.room.code,token:host.token});assert.equal(state.room.players.find(p=>p.id===guest.player_id).lines,1);
  results.push({theme:season,players:2,independentCards:true,imagesResolved:50,winning:true});
 }finally{await post('finish',{code:host.room.code,token:host.token})}
}
await mkdir('artifacts/seasons',{recursive:true});await writeFile('artifacts/seasons/live-rooms.json',JSON.stringify(results,null,2)+'\n');console.log('Live Spring, Summer and No Season rooms passed two-player joining, 50 illustrated squares per room, independent cards, winning marks and host finish.');
