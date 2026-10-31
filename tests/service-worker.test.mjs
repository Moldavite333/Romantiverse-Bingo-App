import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const SOURCE=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
const ORIGIN='https://bingo.cheeselouisepod.com';
const BASE='/';
class BrowserRequest extends Request {
 constructor(input,init){super(new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,ORIGIN),init);this._mode=typeof input==='object'&&input._mode?input._mode:'cors'}
 get mode(){return this._mode}
}
const HTML='<html><script type="module" src="/assets/index-123.js"></script><link rel="stylesheet" href="/assets/index-456.css"></html>';

function harness(){
 const listeners=new Map(),stores=new Map(),calls=[];
 let online=true;
 const cacheApi={
  open:async name=>{
   if(!stores.has(name))stores.set(name,new Map());
   const store=stores.get(name);
   return {
    put:async(req,response)=>store.set(new URL(typeof req==='string'?req:req.url,ORIGIN).href,response.clone()),
    addAll:async paths=>{for(const path of paths){const response=await fakeFetch(new BrowserRequest(path));if(!response.ok)throw Error('Precache failed: '+path);store.set(new URL(path,ORIGIN).href,response.clone())}}
   };
  },
  keys:async()=>[...stores.keys()],
  delete:async name=>stores.delete(name),
  match:async req=>{const key=new URL(typeof req==='string'?req:req.url,ORIGIN).href;for(const store of stores.values())if(store.has(key))return store.get(key).clone();return undefined}
 };
 async function fakeFetch(req){const url=new URL(typeof req==='string'?req:req.url,ORIGIN);calls.push(url.href);if(!online)throw Error('Offline');return new Response(url.pathname===BASE+'index.html'||url.pathname===BASE?HTML:'asset '+url.pathname,{status:200})}
 const self={location:{origin:ORIGIN},addEventListener:(type,fn)=>listeners.set(type,fn),skipWaiting:async()=>{},clients:{claim:async()=>{}}};
 vm.runInNewContext(SOURCE,{self,caches:cacheApi,fetch:fakeFetch,Request:BrowserRequest,Response,URL,Set,Error,Promise});
 async function dispatch(type,request){const pending=[];let response;const event={request,waitUntil:p=>pending.push(Promise.resolve(p)),respondWith:p=>{response=Promise.resolve(p)}};listeners.get(type)(event);if(response){const result=await response;await Promise.all(pending);return result}await Promise.all(pending)}
 return {dispatch,stores,calls,setOnline:v=>{online=v}};
}

test('installation precaches built HTML, fingerprinted assets and public catalog',async()=>{
 const h=harness();await h.dispatch('install');
 const cached=[...h.stores.values()][0];
 for(const path of ['index.html','assets/index-123.js','assets/index-456.css','catalog/movies.json','manifest.webmanifest','icon.svg']){
  assert.ok(cached.has(ORIGIN+BASE+path),'Missing offline resource: '+path);
 }
});

test('an offline direct-link navigation loads cached HTML without caching room code',async()=>{
 const h=harness();await h.dispatch('install');h.setOnline(false);
 const navigation=new BrowserRequest(ORIGIN+BASE+'?room=ABC1234');navigation._mode='navigate';
 const response=await h.dispatch('fetch',navigation);
 assert.equal(await response.text(),HTML);
 const cached=[...h.stores.values()][0];
 assert.ok(![...cached.keys()].some(key=>key.includes('room=')));
});

test('service worker does not intercept requests outside app scope',async()=>{
 const h=harness();await h.dispatch('install');
 const result=await h.dispatch('fetch',new Request(ORIGIN+'/another-app/private.json'));
 assert.equal(result,undefined);
});
