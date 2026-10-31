// Offline-ready static app shell. Room state and private tokens are never cached.
const CACHE='romantiverse-v6-shell';
const BASE='/';
const SHELL=BASE+'index.html';
const PRECACHE=[BASE+'catalog/movies.json',BASE+'manifest.webmanifest',BASE+'icon.svg'];

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  const response=await fetch(new Request(new URL(SHELL,self.location.origin),{cache:'reload'}));
  if(!response.ok)throw Error('Could not precache the Bingo app shell');
  const html=await response.clone().text();
  // Vite fingerprints production JS/CSS filenames; discover them from the built HTML.
  const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map(match=>match[1]);
  await cache.put(SHELL,response);
  await cache.addAll([...new Set([...PRECACHE,...assets])]);
  await self.skipWaiting();
 })());
});

self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('romantiverse-')&&key!==CACHE).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});

self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 // Only intercept the public app shell and its assets, never unrelated same-origin paths.
 if(url.origin!==self.location.origin||!(url.pathname===BASE||url.pathname===SHELL||url.pathname.startsWith(BASE+'assets/')||PRECACHE.includes(url.pathname)))return;
 if(req.mode==='navigate'){
  // A direct invitation may include ?room=CODE. Cache only canonical public HTML,
  // never a URL containing invitation or session parameters.
  event.respondWith(fetch(new Request(req,{cache:'no-store'})).then(response=>{
   if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(SHELL,copy)))}
   return response;
  }).catch(()=>caches.match(SHELL)));
  return;
 }
 // Offline fallback for fingerprinted assets and the public catalog only.
 // The Edge Function and other API requests live on a different origin.
 event.respondWith(fetch(req).then(response=>{
  if(response.ok&&!url.search){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,copy)))}
  return response;
 }).catch(()=>caches.match(req)));
});
