import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {referencedAssets,verifyLiveDeployment} from '../scripts/verify-live-deployment.mjs';
const base='/';
const html='<!doctype html><script type="module" src="'+base+'assets/index-123.js"></script><link rel="stylesheet" href="'+base+'assets/index-456.css">';
const files={'index.html':html,'assets/index-123.js':'console.log("ok")','assets/index-456.css':'body{margin:0}', 'catalog/movies.json':JSON.stringify({version:1,movies:[{title:'Example'}]})};
async function fixture(fn){
 const dir=await mkdtemp(join(tmpdir(),'bingo-live-'));
 try{
  await mkdir(join(dir,'assets'));await mkdir(join(dir,'catalog'));
  for(const [path,content] of Object.entries(files))await writeFile(join(dir,path),content);
  const fetcher=async url=>{const path=new URL(url).pathname.slice(base.length)||'index.html';return new Response(files[path]??'',{status:files[path]===undefined?404:200})};
  return await fn({dir,fetcher});
 }finally{await rm(dir,{recursive:true,force:true})}
}
test('extract only the app fingerprinted JS and CSS',()=>{
 assert.deepEqual(referencedAssets(html,base),[base+'assets/index-123.js',base+'assets/index-456.css']);
 assert.deepEqual(referencedAssets(html,'/unrelated/'),[]);
});
test('verify deployed HTML, JS, CSS and catalog byte-for-byte',()=>fixture(async({dir,fetcher})=>{
 const result=await verifyLiveDeployment('https://bingo.cheeselouisepod.com'+base,{distDir:dir,fetcher,attempts:1});
 assert.equal(result.checked,4);assert.equal(result.attempt,1);
}));
test('reject a stale or substituted JS asset',()=>fixture(async({dir,fetcher})=>{
 const altered=async url=>url.endsWith('.js')?new Response('old JavaScript'):fetcher(url);
 await assert.rejects(verifyLiveDeployment('https://bingo.cheeselouisepod.com'+base,{distDir:dir,fetcher:altered,attempts:1}),/live bytes differ/);
}));
test('reject a missing live catalog',()=>fixture(async({dir,fetcher})=>{
 const missing=async url=>url.endsWith('movies.json')?new Response('Not found',{status:404}):fetcher(url);
 await assert.rejects(verifyLiveDeployment('https://bingo.cheeselouisepod.com'+base,{distDir:dir,fetcher:missing,attempts:1}),/HTTP 404/);
}));
