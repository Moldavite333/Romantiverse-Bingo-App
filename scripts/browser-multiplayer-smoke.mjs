// Browser-level Play Together smoke: Samsung-sized touch viewport + desktop guest.
// Mocks the room API deterministically; the deploy workflow separately exercises real live rooms.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
import aliases from '../src/engine/roomIllustrationAliases.json' with {type:'json'};
import {winningLines} from '../src/engine/bingo.mjs';
const base='/';
const root=resolve('dist');
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!pathname.startsWith(base))throw Error('Outside app');
  const file=resolve(root,pathname.slice(base.length)||'index.html');
  if(!file.startsWith(root+sep)&&file!==resolve(root,'index.html'))throw Error('Outside build');
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const appUrl='http://127.0.0.1:'+server.address().port+base;
const browser=await chromium.launch({headless:true});
const code='AB7K2XY',poster='https://image.tmdb.org/t/p/w780/approved-test.jpg';
const labels=Object.keys(aliases);
const hostCard=Array.from({length:25},(_,i)=>({id:i===12?'free':'cheese-'+i,label:i===12?'FREE SPACE':labels[i],category:i===12?'free':'cheese'}));
const guestCard=Array.from({length:25},(_,i)=>({id:i===12?'free':'seasonal-'+i,label:i===12?'FREE SPACE':labels[i+30],category:i===12?'free':'seasonal'}));
let room={code,host_player_id:'host',movie_title:'Autumn Dreams',movie_collection:'Fall',poster_url:poster,release_year:2015,season:'Fall',mode:'classic',status:'lobby',players:[{id:'host',name:'Nick',lines:0,marked:1}]};
const snapshots={host:{card:hostCard,marked:[12],revision:0},guest:{card:guestCard,marked:[12],revision:0}};
let disconnected=false,creates=0,joins=0;
function playerResponse(id){const snap=snapshots[id];return {room:{...room,players:room.players.map(p=>({...p,marked:snapshots[p.id].marked.length,lines:winningLines(snapshots[p.id].marked,true).length}))},player_id:id,card:snap.card,marked:[...snap.marked],revision:snap.revision}}
function responseFor(body){
 const action=body.action;
 if(action==='create'){
  creates++;
  room={...room,movie_title:body.movie_title,movie_collection:body.movie_collection,poster_url:body.poster_url||poster,season:body.season,mode:body.mode,status:'lobby'};
  snapshots.host={card:hostCard,marked:[12],revision:0};
  return {...playerResponse('host'),token:'a'.repeat(64)};
 }
 if(action==='preview')return {room:{...room,players:[]}};
 if(action==='join'){
  joins++;
  room={...room,players:[...room.players,{id:'guest',name:body.name,lines:0,marked:1}]};
  snapshots.guest={card:guestCard,marked:[12],revision:0};
  return {...playerResponse('guest'),token:'b'.repeat(64)};
 }
 const id=body.token?.startsWith('b')?'guest':'host';
 if(action==='start'){room={...room,status:'playing'};return playerResponse(id)}
 if(action==='finish'){room={...room,status:'finished'};return playerResponse(id)}
 if(action==='mark'){
  const snap=snapshots[id];
  assert.equal(body.revision,snap.revision,'Client must use latest player revision');
  assert.equal(room.status,'playing');
  const marks=new Set(snap.marked);
  marks.has(body.index)?marks.delete(body.index):marks.add(body.index);
  snap.marked=[...marks].sort((a,b)=>a-b);snap.revision++;
  return playerResponse(id);
 }
 return playerResponse(id);
}
async function contextFor(width,mobile){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.route('https://*.supabase.co/**',async route=>{
  const url=route.request().url();
  if(url.endsWith('/functions/v1/game-room')){
   const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,apikey,authorization','Access-Control-Allow-Methods':'POST,OPTIONS'};
   if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers,body:''});
   const payload=JSON.parse(route.request().postData()||'{}');
   if(disconnected&&payload.action==='state')return route.abort('internetdisconnected');
   if(payload.action==='mark')await new Promise(resolve=>setTimeout(resolve,150));
   return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify(responseFor(payload))});
  }
  if(url.includes('bingo-public-posters'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:1,movies:[{title:'Autumn Dreams',release_year:2015,season:'Fall',poster_url:poster}]})});
  return route.fulfill({status:200,contentType:'application/json',body:'[]'});
 });
 await context.route('https://www.wikidata.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"search":[]}'}));
 await context.route('https://image.tmdb.org/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="#633"/></svg>'}));
 await context.route('https://fonts.googleapis.com/**',r=>r.abort());
 await context.route('https://fonts.gstatic.com/**',r=>r.abort());
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__shares=(window.__shares||[]).concat([data])}});
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Samsung clipboard denied')}}});
 });
 return {context,page,errors};
}
try{
 const host=await contextFor(390,true);
 await host.page.goto(appUrl,{waitUntil:'domcontentloaded'});
 await host.page.getByRole('button',{name:'Play Together'}).click();
 await host.page.locator('#host-nickname').fill('Nick');
 // Hosting a shared game must offer the same source-verified discovery as solo play.
 // Network and studio matches come from the public catalog, never private HQ notes.
 for(const [term,title] of [
  ['Hallmark Channel 2023 Biltmore','A Biltmore Christmas'],
  ['Lifetime Carpenter','A Carpenter Christmas Romance'],
  ['MarVista Leah','Leah\'s Perfect Gift'],
  ['Reel One Peppermint','Peppermint and Postcards']
 ]){
  await host.page.locator('#host-movie-search').fill(term);
  await host.page.locator('.room-movie-options button').filter({hasText:title}).first().waitFor();
  assert.ok(await host.page.locator('.room-movie-options button').filter({hasText:title}).first().isVisible(),
   'Play Together host search must find '+title+' by verified metadata');
 }
 await host.page.locator('#host-movie-search').fill('Autumn Dreams');
 await host.page.locator('.room-movie-options button').filter({hasText:'Autumn Dreams'}).first().click();
 assert.match(await host.page.locator('.room-host-panel .room-movie-details').innerText(),/Autumn Dreams[\s\S]*Collection: Fall[\s\S]*Bingo theme: Fall/);
 assert.equal(await host.page.locator('.room-host-panel .room-movie-poster').getAttribute('src'),poster,'Host must see the actual selected movie poster before creating the room');
 await host.page.getByRole('button',{name:'Create Room'}).click();
 const inviteInput=host.page.locator('#room-invite-url');
 await inviteInput.waitFor();
 const invite=await inviteInput.inputValue();
 const parsed=new URL(invite);
 assert.equal(parsed.pathname,base);
 assert.equal(parsed.searchParams.get('room'),code);
 assert.ok(!invite.includes('token'));
 assert.match(await host.page.locator('.room-movie-details').innerText(),/Autumn Dreams[\s\S]*Collection: Fall/);
 // A stalled Android share sheet must not hide the ready-to-send invitation.
 await host.page.evaluate(()=>{
  Object.defineProperty(navigator,'share',{configurable:true,value:()=>new Promise(()=>{})});
 });
 await host.page.getByRole('button',{name:'Share Invite'}).click();
 await host.page.locator('#room-invite-message').waitFor({state:'visible',timeout:1500});
 assert.ok((await host.page.locator('#room-invite-message').inputValue()).includes(invite),'Pending Android share sheet must not block manual invitation');
 await host.page.evaluate(()=>{
  Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__shares=(window.__shares||[]).concat([data])}});
 });
 // Samsung can leave the clipboard permission request unresolved indefinitely.
 // The user must still see a usable invitation without waiting for that promise.
 await host.page.evaluate(()=>{
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise(()=>{})}});
  document.execCommand=()=>false;
 });
 await host.page.getByRole('button',{name:'Copy Invite Link'}).click();
 await host.page.locator('#room-invite-message').waitFor({state:'visible',timeout:1500});
 assert.ok((await host.page.locator('#room-invite-message').inputValue()).includes(invite),'Pending clipboard permission must not hide manual invitation');
 await host.page.evaluate(()=>{
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('Samsung clipboard denied')}}});
 });
 await host.page.getByRole('button',{name:'Copy Invite Link'}).click();
 assert.equal(await inviteInput.inputValue(),invite,'Blocked clipboard must preserve selectable link');
 const manualText=await host.page.locator('#room-invite-message').inputValue();
 assert.ok(manualText.includes(invite),'Samsung copy attempt must always expose manual invitation');
 assert.match(manualText,/Autumn Dreams[\s\S]*Fall collection[\s\S]*Bingo theme: Fall/);
 assert.ok(manualText.includes('Brought to you by the Cheese Louise Podcast'));
 await host.page.getByRole('button',{name:'Share Invite'}).click();
 await host.page.waitForFunction(()=>window.__shares?.length===1);
 const share=await host.page.evaluate(()=>window.__shares[0]);
 assert.equal(share.url,invite);
 assert.ok(share.text.includes(invite),'Android share text must include the actual URL');
 assert.match(share.text,/Bingo theme: Fall/);
 assert.ok(share.text.includes('Brought to you by the Cheese Louise Podcast'));
 // Dismissing the Android share sheet must not leave a misleading
 // "Opening sharing" status or hide the manual invitation.
 await host.page.evaluate(()=>{
  Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{
   const error=new Error('User dismissed sharing');error.name='AbortError';throw error;
  }});
 });
 await host.page.getByRole('button',{name:'Share Invite'}).click();
 await host.page.getByRole('status').filter({hasText:'Sharing cancelled.'}).waitFor();
 assert.ok((await host.page.locator('#room-invite-message').inputValue()).includes(invite),'Cancelled share must retain the complete selectable invitation');
 assert.equal(await host.page.locator('.board.live-board .square').count(),25);
 const hostLabels=await host.page.locator('.board.live-board .square-label').allTextContents();
 const hostOverflow=await host.page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 assert.ok(hostOverflow<=2,'Mobile multiplayer must not overflow horizontally: '+hostOverflow);
 assert.deepEqual(host.errors,[],'Mobile host JavaScript errors');
 const guest=await contextFor(1440,false);
 await guest.page.goto(invite,{waitUntil:'domcontentloaded'});
 await guest.page.locator('#join-nickname').waitFor();
 await guest.page.locator('.room-join-panel .room-movie-details').waitFor();
 assert.match(await guest.page.locator('.room-join-panel .room-movie-details').innerText(),/Autumn Dreams[\s\S]*Collection: Fall/);
 assert.equal(await guest.page.locator('.room-join-panel .room-movie-poster').getAttribute('src'),poster,'Invited guest must see the same movie poster before joining');
 await guest.page.locator('#join-nickname').fill('Jenny');
 assert.equal(await guest.page.locator('#join-code').inputValue(),code);
 await guest.page.getByRole('button',{name:'Join Game'}).click();
 await guest.page.locator('.board.live-board .square').first().waitFor();
 const guestLabels=await guest.page.locator('.board.live-board .square-label').allTextContents();
 assert.equal(await guest.page.getByRole('button',{name:'Start Movie (host only)',exact:true}).count(),0,'Guests must not see host-only start controls');
 assert.equal(guestLabels.length,25);
 assert.notDeepEqual(guestLabels,hostLabels,'Guest must receive a different randomized card');
 assert.match(await guest.page.locator('.room-movie-details').innerText(),/Autumn Dreams[\s\S]*Collection: Fall[\s\S]*Bingo theme: Fall/);
 const desktopOverflow=await guest.page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 assert.ok(desktopOverflow<=2,'Desktop multiplayer must not overflow horizontally');
 assert.deepEqual(guest.errors,[],'Desktop guest JavaScript errors');
 // Live winning lines must be server-confirmed, highlighted and accessible.
 await host.page.getByRole('button',{name:'Start Movie (host only)'}).click();
 assert.equal(await guest.page.getByRole('button',{name:'Finish Movie (host only)',exact:true}).count(),0,'Guests must not see host-only end controls');
 for(const index of [0,1,2,3,4])await host.page.locator('.live-board .square').nth(index).click();
 await host.page.locator('.live-board.winner').waitFor();
 assert.equal(await host.page.locator('.live-board .square.in-line').count(),5);
 assert.match(await host.page.locator('.multiplayer .victory').innerText(),/BINGO!/);
 assert.match(await host.page.locator('.multiplayer .victory').innerText(),/1 completed line/);
 assert.equal(await guest.page.locator('.live-board.winner').count(),0,'Host wins must not mark guest card');
 await host.page.emulateMedia({reducedMotion:'reduce'});
 assert.equal(await host.page.locator('.live-board.winner').evaluate(el=>getComputedStyle(el).animationName),'none');
 assert.equal(await host.page.locator('.live-board .square.marked').first().evaluate(el=>getComputedStyle(el).animationName),'none');
 await mkdir('artifacts/artwork',{recursive:true});
 for(const fixture of [host,guest])await fixture.page.waitForFunction(()=>document.querySelectorAll('.live-board .square-art').length===25&&[...document.querySelectorAll('.live-board .square-art')].every(img=>img.complete&&img.naturalWidth>0));
 await host.page.screenshot({path:'artifacts/artwork/multiplayer-mobile-winning.png',fullPage:true,animations:'disabled'});
 await guest.page.screenshot({path:'artifacts/artwork/multiplayer-desktop-guest.png',fullPage:true,animations:'disabled'});
 // Android can discard a background tab or open a new window without the old
 // window's sessionStorage. Reuse the existing player and confirmed snapshot.
 const savedHostLabels=await host.page.locator('.live-board .square-label').allTextContents();
 await host.page.evaluate(()=>sessionStorage.clear());disconnected=true;
 const returned=await host.context.newPage(),returnErrors=[];returned.on('pageerror',e=>returnErrors.push(e.message));
 await returned.goto(appUrl,{waitUntil:'domcontentloaded'});
 await returned.locator('.live-board .square').first().waitFor();
 assert.deepEqual(await returned.locator('.live-board .square-label').allTextContents(),savedHostLabels,'New window restores the identical card');
 assert.equal(await returned.locator('.live-board .square.in-line').count(),5,'Confirmed winning marks survive without network');
 assert.equal(await returned.locator('.live-board .square').first().isDisabled(),true,'Cached state is read-only until server reconnection');
 await returned.getByRole('status').filter({hasText:'Your saved card and marks are here.'}).waitFor();
 disconnected=false;await returned.evaluate(()=>window.dispatchEvent(new Event('online')));
 await returned.waitForFunction(()=>!document.querySelector('.live-board .square').disabled);
 await returned.evaluate(()=>{for(const i of [5,6,7])document.querySelectorAll('.live-board .square')[i].click()});
 await returned.waitForFunction(()=>[5,6,7].every(i=>document.querySelectorAll('.live-board .square')[i].getAttribute('aria-pressed')==='true'));
 await returned.locator('.live-board .square').nth(7).click();
 await returned.waitForFunction(()=>document.querySelectorAll('.live-board .square')[7].getAttribute('aria-pressed')==='false');
 await returned.reload();await returned.locator('.live-board .square').first().waitFor();
 assert.equal(await returned.locator('.live-board .square').nth(5).getAttribute('aria-pressed'),'true','Newly confirmed mark survives reload');
 await returned.getByRole('button',{name:'Discover',exact:true}).click();
 await returned.getByRole('button',{name:'Cheese Tray',exact:true}).click();
 await returned.getByRole('region',{name:'Saved games'}).getByRole('button',{name:'Resume shared game',exact:true}).click();
 await returned.locator('.live-board .square').first().waitFor();
 assert.equal(await returned.locator('.live-board .square').nth(5).getAttribute('aria-pressed'),'true');
 assert.equal(creates,1,'Resume never creates another game');assert.equal(joins,1,'Resume never creates a replacement player');
 assert.deepEqual(returnErrors,[]);assert.ok(!(await returned.locator('body').innerText()).includes('a'.repeat(64)),'Private player token stays out of the UI');
 await returned.screenshot({path:'artifacts/artwork/mobile-room-resumed.png',fullPage:true,animations:'disabled'});
 assert.ok(await returned.evaluate(()=>document.querySelector('.live-board').getBoundingClientRect().top>=document.querySelector('.room-play-progress').getBoundingClientRect().bottom),'Progress feedback must not obscure the Bingo header');
 returned.once('dialog',dialog=>dialog.dismiss());await returned.getByRole('button',{name:'Finish Movie (host only)',exact:true}).click();assert.equal(room.status,'playing','Cancelling end-game confirmation keeps everyone playing');
 returned.once('dialog',dialog=>dialog.accept());await returned.getByRole('button',{name:'Finish Movie (host only)',exact:true}).click();
 await returned.getByText('Movie night complete. Your card and marks remain in Your saved games on this device.').waitFor();
 assert.equal(await returned.locator('.live-board .square').first().isDisabled(),true,'Completed room remains reviewable and read-only');
 await returned.getByRole('button',{name:'Cheese Tray',exact:true}).click();assert.ok(await returned.getByRole('button',{name:'Review shared game',exact:true}).isVisible());
 await returned.close();
 console.log('Verified rapid taps, undo, host-only controls, end-game confirmation and completed shared-game history.');
 console.log('Verified mobile new-window recovery, cached offline card/marks, immediate reconnect, reload and unfinished-game history without rejoining.');
 console.log('Verified mobile host copy/share fallback, movie metadata, unique room URL, desktop guest join and independent cards.');
 await host.context.close();await guest.context.close();
}finally{await browser.close();await new Promise(ok=>server.close(ok))}
