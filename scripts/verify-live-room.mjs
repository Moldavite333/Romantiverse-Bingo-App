// Public end-to-end smoke test: a real unique room, two players and a direct invite.
// Run only after Pages deploy. Never print player tokens or persist test sessions.
import assert from 'node:assert/strict';
import {roomInviteUrl,parseRoomInvite} from '../src/engine/roomInvites.mjs';
const ENDPOINT='https://yxpamyibhclilgdhgsjd.supabase.co/functions/v1/game-room';
async function post(action,payload={}){
 const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://moldavite333.github.io'},body:JSON.stringify({action,...payload}),signal:AbortSignal.timeout(15000)});
 const data=await response.json();
 if(!response.ok)throw Error(action+' failed: HTTP '+response.status+' '+(data?.error||'unknown'));
 assert.equal(response.headers.get('access-control-allow-origin'),'https://moldavite333.github.io');
 return data;
}
export async function verifyLiveRoom(siteUrl){
 const site=new URL(siteUrl);
 assert.equal(site.protocol,'https:');
 assert.equal(site.pathname,'/Romantiverse-Bingo-App/');
 const catalogResponse=await fetch(new URL('catalog/movies.json',site),{cache:'no-store',signal:AbortSignal.timeout(15000)});
 assert.ok(catalogResponse.ok,'Live movie catalog must be reachable');
 const catalog=await catalogResponse.json();
 const movie=catalog.movies.find(m=>m.season==='Fall'&&!m.is_demo&&Number.isInteger(m.release_year));
 assert.ok(movie,'Need a real catalog movie with an actual collection');
 const host=await post('create',{name:'Bingo Launch QA Host',movie_title:movie.title,movie_collection:movie.season,release_year:movie.release_year,season:movie.season,mode:'classic'});
 assert.match(host.room.code,/^[A-Z2-9]{7}$/);
 assert.equal(host.room.movie_title,movie.title);
 assert.equal(host.room.movie_collection,movie.season);
 assert.equal(host.room.season,movie.season);
 assert.equal(host.room.release_year,movie.release_year);
 assert.equal(host.card.length,25);
 const invite=roomInviteUrl(site.toString(),host.room.code);
 assert.equal(parseRoomInvite(new URL(invite).search),host.room.code);
 assert.equal(new URL(invite).pathname,site.pathname);
 assert.ok(!invite.includes(host.token),'No session token in public invite');
 const preview=await post('preview',{code:host.room.code});
 assert.equal(preview.room.movie_title,movie.title);
 assert.equal(preview.room.movie_collection,movie.season);
 assert.equal(preview.room.season,movie.season);
 assert.deepEqual(preview.room.players,[],'Preview must not leak players');
 const guest=await post('join',{code:host.room.code,name:'Bingo Launch QA Guest'});
 assert.equal(guest.room.movie_title,movie.title);
 assert.equal(guest.room.season,movie.season);
 assert.equal(guest.card.length,25);
 assert.notDeepEqual(guest.card,host.card,'Each player needs an independent card');
 assert.equal(guest.room.players.length,2);
 const state=await post('state',{code:host.room.code,token:guest.token});
 assert.equal(state.player_id,guest.player_id);
 assert.deepEqual(state.card,guest.card);
 await post('start',{code:host.room.code,token:host.token});
 const mark=await post('mark',{code:host.room.code,token:guest.token,index:0,revision:guest.revision});
 assert.ok(mark.marked.includes(0));
 const hostState=await post('state',{code:host.room.code,token:host.token});
 assert.equal(hostState.room.status,'playing');
 assert.equal(hostState.room.players.find(p=>p.id===guest.player_id).marked,2,'Host sees guest progress');
 await post('finish',{code:host.room.code,token:host.token});
 return {movie:movie.title,collection:movie.season,room:host.room.code,invite,players:2};
}
if(process.argv[1]?.endsWith('verify-live-room.mjs')){
 const result=await verifyLiveRoom(process.argv[2]||'https://moldavite333.github.io/Romantiverse-Bingo-App/');
 console.log('Verified unique public room invitation, server movie metadata, two independent cards, join, marks and finish for '+result.movie+'.');
}
