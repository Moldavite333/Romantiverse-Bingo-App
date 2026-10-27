// Browser-level Play Together smoke: Samsung-sized touch viewport + desktop guest.
// Mocks the room API deterministically; the deploy workflow separately exercises real live rooms.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const base='/Romantiverse-Bingo-App/';
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
const hostCard=Array.from({length:25},(_,i)=>({id:'host-'+i,label:i===12?'FREE SPACE':'Host trope '+i,category:i===12?'free':'cheese'}));
const guestCard=Array.from({length:25},(_,i)=>({id:'guest-'+i,label:i===12?'FREE SPACE':'Guest trope '+i,category:i===12?'free':'cheese'}));
let room={code,movie_title:'Autumn Dreams',movie_collection:'Fall',poster_url:poster,release_year:2015,season:'Fall',mode:'classic',status:'lobby',players:[{id:'host',name:'Nick',lines:0,marked:1}]};
function responseFor(body){
 const action=body.action;
 if(action==='create'){
  room={...room,movie_title:body.movie_title,movie_collection:body.movie_collection,poster_url:body.poster_url||poster,season:body.season,mode:body.mode};
  return {room,player_id:'host',token:'a'.repeat(64),card:hostCard,marked:[12],revision:0};
 }
 if(action==='preview')return {room:{...room,players:[]}};
 if(action==='join'){
  room={...room,players:[...room.players,{id:'guest',name:body.name,lines:0,marked:1}]};
  return {room,player_id:'guest',token:'b'.repeat(64),card:guestCard,marked:[12],revision:0};
 }
 if(action==='state')return {room,player_id:body.token?.startsWith('b')?'guest':'host',card:body.token?.startsWith('b')?guestCard:hostCard,marked:[12],revision:0};
 return {room};
}
async function contextFor(width,mobile){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://*.supabase.co/**',async route=>{
  const url=route.request().url();
  if(url.endsWith('/functions/v1/game-room')){
   const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,apikey,authorization','Access-Control-Allow-Methods':'POST,OPTIONS'};
   if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers,body:''});
   const payload=JSON.parse(route.request().postData()||'{}');
   return route.fulfill({status:200,contentType:'application/json',headers,body:JSON.stringify(responseFor(payload))});
  }
  if(url.includes('bingo-public-posters'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:1,movies:[{title:'Autumn Dreams',release_year:2015,season:'Fall',poster_url:poster}]})});
  return route.fulfill({status:200,contentType:'application/json',body:'[]'});
 });
 await page.route('https://www.wikidata.org/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"search":[]}'}));
 await page.route('https://image.tmdb.org/**',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300"><rect width="200" height="300" fill="#633"/></svg>'}));
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.route('https://fonts.gstatic.com/**',r=>r.abort());
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
 assert.equal(guestLabels.length,25);
 assert.notDeepEqual(guestLabels,hostLabels,'Guest must receive a different randomized card');
 assert.match(await guest.page.locator('.room-movie-details').innerText(),/Autumn Dreams[\s\S]*Collection: Fall[\s\S]*Bingo theme: Fall/);
 const desktopOverflow=await guest.page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
 assert.ok(desktopOverflow<=2,'Desktop multiplayer must not overflow horizontally');
 assert.deepEqual(guest.errors,[],'Desktop guest JavaScript errors');
 console.log('Verified mobile host copy/share fallback, movie metadata, unique room URL, desktop guest join and independent cards.');
 await host.context.close();await guest.context.close();
}finally{await browser.close();await new Promise(ok=>server.close(ok))}
