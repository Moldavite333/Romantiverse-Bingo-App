// Verify GitHub Pages serves the exact static build after deployment.
// Public files only: never request room state, private tokens or Cheese Louise HQ.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const wait=ms=>new Promise(ok=>setTimeout(ok,ms));
export function referencedAssets(html,basePath){
 return [...new Set([...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(m=>m[1]).filter(path=>path.startsWith(basePath+'assets/')&&/\.(?:js|css)$/.test(path)))];
}
export async function verifyLiveDeployment(siteUrl,{distDir='dist',fetcher=fetch,attempts=12,delayMs=10000}={}){
 const site=new URL(siteUrl);
 if(site.protocol!=='https:'||!site.pathname.endsWith('/'))throw Error('Expected an HTTPS GitHub Pages app URL ending in /');
 const base=site.pathname;
 const localHtml=await readFile(join(distDir,'index.html'));
 const assets=referencedAssets(localHtml.toString('utf8'),base);
 if(!assets.some(p=>p.endsWith('.js'))||!assets.some(p=>p.endsWith('.css')))throw Error('Built HTML is missing fingerprinted JavaScript or CSS');
 const paths=[base,base+'catalog/movies.json',...assets];
 const expected=new Map();
 for(const path of paths){
  const relative=path===base?'index.html':path.slice(base.length);
  expected.set(path,digest(await readFile(join(distDir,relative))));
 }
 let lastError='';
 for(let attempt=1;attempt<=attempts;attempt++){
  try{
   for(const path of paths){
    const url=new URL(path,site.origin);
    const response=await fetcher(url.toString(),{cache:'no-store',signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw Error(path+': HTTP '+response.status);
    const bytes=Buffer.from(await response.arrayBuffer());
    if(digest(bytes)!==expected.get(path))throw Error(path+': live bytes differ from the deployed build');
    if(path===base+'catalog/movies.json'){
     const catalog=JSON.parse(bytes.toString('utf8'));
     if(catalog.version!==1||!Array.isArray(catalog.movies)||catalog.movies.length===0)throw Error('Live catalog is missing or invalid');
    }
   }
   return {attempt,checked:paths.length,site:site.toString()};
  }catch(error){
   lastError=String(error?.message||error);
   if(attempt<attempts)await wait(delayMs);
  }
 }
 throw Error('Live deployment did not match the built artifacts after '+attempts+' attempts: '+lastError);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const url=process.argv[2];
 if(!url)throw Error('Usage: node scripts/verify-live-deployment.mjs <deployed GitHub Pages URL>');
 const result=await verifyLiveDeployment(url);
 console.log('Verified '+result.checked+' live files match the production build at '+result.site+' (attempt '+result.attempt+').');
}
