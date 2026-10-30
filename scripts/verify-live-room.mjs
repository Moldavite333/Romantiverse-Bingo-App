// Public end-to-end smoke test: a real unique room, two players and a direct invite.
// Run only after Pages deploy. Never print player tokens or persist test sessions.
import assert from 'node:assert/strict';
import {roomInviteUrl,parseRoomInvite} from '../src/engine/roomInvites.mjs';
const ENDPOINT='https://yxpamyibhclilgdhgsjd.supabase.co/functions/v1/game-room';
/** A missing public poster is legitimate: the native and web clients render a fallback. */
export function verifiedPosterForMovie(movie,feed){
 const url=feed.movies.find(m=>m.title===movie.title&&m.release_year===movie.release_year)?.poster_url;
 return typeof url==='string'&&url.startsWith('https://image.tmdb.org/t/p/')?url:null;
}
async function post(action,payload={}){
 const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://moldavite333.github.io'},body:JSON.stringify({action,...payload}),signal:AbortSignal.timeout(15000)});
 const data=await response.json();
 if(!response.ok)throw Error(action+' failed: HTTP '+response.status+' '+(data?.error||'unknown'));
 assert.equal(response.headers.get('access-control-allow-origin'),'https://moldavite333.github.io');
 return data;
}
/** Live deployment must refuse horror room creation even from direct API clients. */
async function assertHorrorRoomRejected(payload){
 const response=await fetch(ENDPOINT,{
  method:'POST',
  headers:{'Content-Type':'application/json',Origin:'https://moldavite333.github.io'},
  body:JSON.stringify({action:'create',...payload}),
  signal:AbortSignal.timeout(15000)
 });
 const data=await response.json();
 assert.equal(response.status,400,'Horror room creation must be rejected by the deployed server');
 assert.equal(data.error,'Invalid room details');
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
 const postersResponse=await fetch('https://wgvsnmukiaobcbyqhkkt.supabase.co/functions/v1/bingo-public-posters',{cache:'no-store',signal:AbortSignal.timeout(15000)});
 assert.ok(postersResponse.ok,'Public poster feed must be reachable');
 const posterFeed=await postersResponse.json();
 const poster=verifiedPosterForMovie(movie,posterFeed);
 assert.ok(poster?.startsWith('https://image.tmdb.org/t/p/'),'Selected real catalog movie must have verified poster artwork');
 // Verify the public server itself enforces romance-only launch scope.
 await assertHorrorRoomRejected({name:'Bingo QA',movie_title:movie.title,
  movie_collection:'Horror',season:'Romance',mode:'classic'});
 await assertHorrorRoomRejected({name:'Bingo QA',movie_title:movie.title,
  movie_collection:movie.season,season:'Horror',mode:'classic'});
 const host=await post('create',{name:'Bingo Launch QA Host',movie_title:movie.title,movie_collection:movie.season,poster_url:poster,release_year:movie.release_year,season:movie.season,mode:'classic'});
 assert.match(host.room.code,/^[A-Z2-9]{7}$/);
 assert.equal(host.room.movie_title,movie.title);
 assert.equal(host.room.movie_collection,movie.season);
 assert.equal(host.room.season,movie.season);
 assert.equal(host.room.release_year,movie.release_year);
 assert.equal(host.room.poster_url,poster);
 assert.equal(host.card.length,25);
 const uniqueVisibleLabels=card=>new Set(card.map(t=>String(t.label).normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase())).size===25;
 assert.ok(uniqueVisibleLabels(host.card),'Host card must not repeat visible trope labels');
 const retired=/impossibly cute|completely avoidable|wildly dramatic|very late romantic|suspiciously perfect|perfectly timed/i;
 assert.ok(host.card.every(square=>!retired.test(square.label)),'Live host card must not include retired fluffy trope wording');
 const invite=roomInviteUrl(site.toString(),host.room.code);
 assert.equal(parseRoomInvite(new URL(invite).search),host.room.code);
 assert.equal(new URL(invite).pathname,site.pathname);
 assert.ok(!invite.includes(host.token),'No session token in public invite');
 const preview=await post('preview',{code:host.room.code});
 assert.equal(preview.room.movie_title,movie.title);
 assert.equal(preview.room.movie_collection,movie.season);
 assert.equal(preview.room.season,movie.season);
 assert.equal(preview.room.poster_url,poster);
 assert.deepEqual(preview.room.players,[],'Preview must not leak players');
 // Verify two real rooms receive distinct invitation URLs, even when created
 // consecutively. An unclassified catalog title must never acquire an
 // invented collection from its separately selected Bingo card theme.
 const unclassified=catalog.movies.find(m=>m.season==='Unspecified'&&!m.is_demo&&Number.isInteger(m.release_year));
 assert.ok(unclassified,'Need a real catalog movie with unverified collection metadata');
 const secondPoster=verifiedPosterForMovie(unclassified,posterFeed);
 // Unknown movie collections do not imply that a verified poster exists.
 // Test the real no-poster fallback instead of inventing artwork or failing deployment.
 const second=await post('create',{name:'Bingo Launch QA Second Host',movie_title:unclassified.title,movie_collection:unclassified.season,poster_url:secondPoster,release_year:unclassified.release_year,season:'Romance',mode:'classic'});
 assert.notEqual(second.room.code,host.room.code,'Consecutive live rooms must have unique join codes');
 const secondInvite=roomInviteUrl(site.toString(),second.room.code);
 assert.notEqual(secondInvite,invite,'Each real game must have a distinct public invitation URL');
 assert.equal(parseRoomInvite(new URL(secondInvite).search),second.room.code);
 assert.ok(!secondInvite.includes(second.token),'Second invitation must not expose its private session token');
 const secondPreview=await post('preview',{code:second.room.code});
 assert.equal(secondPreview.room.movie_title,unclassified.title);
 assert.equal(secondPreview.room.movie_collection,'Unspecified','Unknown collection must stay unverified, not inferred from the theme');
 assert.equal(secondPreview.room.season,'Romance','Chosen Bingo theme must remain separate from movie collection');
 assert.equal(secondPreview.room.poster_url,secondPoster);
 assert.deepEqual(secondPreview.room.players,[],'Second preview must not leak players');
 const guest=await post('join',{code:host.room.code,name:'Bingo Launch QA Guest'});
 assert.equal(guest.room.movie_title,movie.title);
 assert.equal(guest.room.season,movie.season);
 assert.equal(guest.room.poster_url,poster);
 assert.equal(guest.card.length,25);
 assert.ok(uniqueVisibleLabels(guest.card),'Guest card must not repeat visible trope labels');
 assert.ok(guest.card.every(square=>!retired.test(square.label)),'Live guest card must not include retired fluffy trope wording');
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
