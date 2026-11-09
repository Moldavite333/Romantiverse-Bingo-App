import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=resolve('dist'),out='artifacts/detail-cleanup/fallback',mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'};
const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!p.startsWith(root+sep))throw Error();res.writeHead(200,{'Content-Type':mime[extname(p)]||'application/octet-stream'}).end(await readFile(p))}catch{res.writeHead(404).end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});const results=[];
try{
 for(const failDetail of [false,true]){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2}),page=await context.newPage();
  await page.route('https://*.supabase.co/**',r=>r.fulfill({json:[]}));await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.route('https://fonts.gstatic.com/**',r=>r.abort());
  if(failDetail)await page.route('**/illustrations/detail/*.webp',r=>r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.getByRole('button',{name:'Play This Movie'}).first().click();
  try{await page.waitForFunction(()=>{const a=[...document.querySelectorAll('.board .square-art')];return a.length===25&&a.every(i=>i.complete&&i.naturalWidth===384)})}catch(e){console.log(await page.locator('.board .square-art').evaluateAll(a=>a.map(i=>({id:i.dataset.illustrationId,width:i.naturalWidth,src:i.currentSrc,complete:i.complete}))));throw e}
  assert.equal(await page.locator('.square-art-missing').count(),0);
  assert.ok(await page.locator('.board .square-art').evaluateAll((imgs,failed)=>imgs.every(i=>i.dataset.illustrationId==='free'||i.currentSrc.includes('/illustrations/detail/')!==failed),failDetail));
  await page.locator('.card-art-guide>summary').click();await page.locator('.card-art-guide').screenshot({path:`${out}/${failDetail?'fallback':'detail'}-guide.png`});
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  // Simulate an uncached detail request offline: canonical art is precached.
  await page.evaluate(async()=>{for(const name of await caches.keys()){const cache=await caches.open(name);for(const req of await cache.keys())if(new URL(req.url).pathname.includes('/illustrations/detail/'))await cache.delete(req)}});
  await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{const a=[...document.querySelectorAll('.board .square-art')];return a.length===25&&a.every(i=>i.complete&&i.naturalWidth===384)});
  assert.equal(await page.locator('.square-art-missing').count(),0);await page.locator('.board .square').first().click();assert.equal(await page.locator('.board .square').first().getAttribute('aria-pressed'),'true');
  await page.locator('.board').screenshot({path:`${out}/${failDetail?'failed-detail':'normal'}-offline.png`});results.push({failDetail,dpr:2,online:true,offline:true,marking:true});await context.close();
 }
 await writeFile(`${out}/report.json`,JSON.stringify(results,null,2));console.log('Detail exports: DPR2 selection, larger guide, failed-image fallback, uncached-detail offline reload and marking passed.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
